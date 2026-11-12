import crc from "crc/crc32";

import {
  type ApiRoute,
  RequestValidationTargets,
  type TypeDeclaration,
  type ValidationDefinition,
  type ValidationTarget,
} from "@kosmojs/core";
import { type HTTPMethod, HTTPMethods } from "@kosmojs/core/api";

import { type AstNode, type ParsedSource, parseSource, textOf } from "./parse";

export type PathResolver = (path: string) => string;

/**
 * The default-exported `defineRoute(...)` call of a route file,
 * with the source it was parsed from.
 * */
export type RouteCall = {
  node: AstNode;
  sourceFile: ParsedSource;
};

/**
 * What a route file declares: its type-level declarations, the params refinements,
 * the methods and each method's validation definitions.
 * Read from the syntax alone - nothing is type checked.
 * */
export const resolveRouteSignature = (
  route: Pick<ApiRoute, "id" | "name" | "fileFullpath"> &
    Partial<Pick<ApiRoute, "optionalParams">>,
  opts: {
    importSpecifierResolver: PathResolver;
    sourceFile?: ParsedSource;
  },
) => {
  const sourceFile = opts?.sourceFile ?? parseSource(route.fileFullpath);

  const typeDeclarations = extractTypeDeclarations(sourceFile, opts);

  const defaultExport = extractDefaultExport(sourceFile);

  const paramsRefinements = defaultExport
    ? extractParamsRefinements(defaultExport)
    : undefined;

  const methods = defaultExport
    ? extractRouteMethods(route, defaultExport)
    : [];

  return {
    typeDeclarations,
    paramsRefinements,
    methods: methods.map((e) => e.method),
    validationDefinitions: methods.flatMap((e) => e.validationDefinitions),
  };
};

/**
 * Type-level imports, the file's own type aliases, interfaces and enums,
 * and type-level re-exports - grouped in that order.
 * A declaration keeps the comments above it.
 * */
export const extractTypeDeclarations = (
  sourceFile: ParsedSource,
  {
    importSpecifierResolver,
  }: {
    importSpecifierResolver: PathResolver;
  },
): Array<TypeDeclaration> => {
  const { program, source } = sourceFile;
  const statements = program.body;
  const declarations: Array<TypeDeclaration> = [];

  // a statement's full text runs from the end of the one before it,
  // so the comments above it come along
  const fullText = new Map<AstNode, string>();

  for (const [i, node] of statements.entries()) {
    const start = i === 0 ? 0 : (statements[i - 1]?.end ?? 0);
    fullText.set(node, source.slice(start, node.end).trim());

    if (node.type !== "ImportDeclaration") {
      continue;
    }

    const path = importSpecifierResolver(node.source.value);
    const typeOnlyDeclaration = node.importKind === "type";
    const specifiers: Array<AstNode> = node.specifiers;

    // iterating specifiers multiple times in this exactly order is essential

    for (const spec of specifiers) {
      if (spec.type === "ImportDefaultSpecifier" && typeOnlyDeclaration) {
        const name = spec.local.name;
        declarations.push({
          importDeclaration: { name, path },
          text: `import type ${name} from "${path}";`,
        });
      }
    }

    for (const spec of specifiers) {
      if (spec.type === "ImportNamespaceSpecifier" && typeOnlyDeclaration) {
        const name = spec.local.name;
        declarations.push({
          importDeclaration: { name, path },
          text: `import type * as ${name} from "${path}";`,
        });
      }
    }

    for (const spec of specifiers) {
      if (spec.type !== "ImportSpecifier") {
        continue;
      }
      if (spec.importKind !== "type" && !typeOnlyDeclaration) {
        continue;
      }
      const name = spec.imported.name ?? spec.imported.value;
      const alias = spec.local.name !== name ? spec.local.name : undefined;
      const nameText = alias ? `${name} as ${alias}` : name;
      declarations.push({
        importDeclaration: { name, alias, path },
        text: `import type { ${nameText} } from "${path}";`,
      });
    }
  }

  const declared = (type: string) => {
    return statements.flatMap((node) => {
      const decl =
        node.type === "ExportNamedDeclaration" ? node.declaration : node;
      return decl?.type === type ? [[node, decl] as const] : [];
    });
  };

  for (const [node, decl] of declared("TSTypeAliasDeclaration")) {
    declarations.push({
      typeAliasDeclaration: { name: decl.id.name },
      text: fullText.get(node) as string,
    });
  }

  for (const [node, decl] of declared("TSInterfaceDeclaration")) {
    declarations.push({
      interfaceDeclaration: { name: decl.id.name },
      text: fullText.get(node) as string,
    });
  }

  for (const [node, decl] of declared("TSEnumDeclaration")) {
    declarations.push({
      enumDeclaration: { name: decl.id.name },
      text: fullText.get(node) as string,
    });
  }

  for (const node of statements) {
    if (node.type !== "ExportNamedDeclaration" || node.declaration) {
      continue;
    }

    const path = node.source
      ? importSpecifierResolver(node.source.value)
      : undefined;

    for (const spec of node.specifiers as Array<AstNode>) {
      if (spec.exportKind !== "type" && node.exportKind !== "type") {
        continue;
      }
      const name = spec.local.name ?? spec.local.value;
      const exported = spec.exported.name ?? spec.exported.value;
      const alias = exported !== name ? exported : undefined;
      const nameText = alias ? `${name} as ${alias}` : name;
      declarations.push({
        exportDeclaration: { name, alias: alias ?? name, path },
        text: path
          ? `export type { ${nameText} } from "${path}";`
          : `export type { ${nameText} };`,
      });
    }
  }

  return declarations;
};

/**
 * The `export default <call>(...)` of a route file.
 * */
export const extractDefaultExport = (
  sourceFile: ParsedSource,
): RouteCall | undefined => {
  for (const node of sourceFile.program.body) {
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration.type === "CallExpression"
    ) {
      return { node: node.declaration, sourceFile };
    }
  }
  return undefined;
};

export const extractGenerics = (call: AstNode): Array<AstNode> => {
  return call.typeArguments?.params ?? [];
};

/**
 * The second generic of `defineRoute` - a tuple refining the params, in path order.
 * */
export const extractParamsRefinements = ({
  node,
  sourceFile,
}: RouteCall): Array<{ index: number; text: string }> | undefined => {
  const [_routeName, paramsGeneric] = extractGenerics(node);

  if (paramsGeneric?.type !== "TSTupleType") {
    return undefined;
  }

  return (paramsGeneric.elementTypes as Array<AstNode>).map(
    (element, index) => {
      return { index, text: textOf(sourceFile, element) };
    },
  );
};

/**
 * The methods `defineRoute` declares, in the array its factory returns:
 *
 *   defineRoute(({ GET, POST }) => [ GET<...>(...), POST<...>(...) ])
 * */
export const extractRouteMethods = (
  route: Pick<ApiRoute, "id" | "name">,
  { node, sourceFile }: RouteCall,
): Array<{
  method: HTTPMethod;
  validationDefinitions: Array<ValidationDefinition>;
}> => {
  const func = (node.arguments as Array<AstNode>).find((arg) => {
    return (
      arg.type === "ArrowFunctionExpression" ||
      arg.type === "FunctionExpression"
    );
  });

  if (func?.body?.type !== "ArrayExpression") {
    return [];
  }

  const methods: ReturnType<typeof extractRouteMethods> = [];

  for (const element of func.body.elements as Array<AstNode | null>) {
    if (element?.type !== "CallExpression") {
      continue;
    }

    const method = textOf(sourceFile, element.callee) as HTTPMethod;

    if (!HTTPMethods[method]) {
      continue;
    }

    const [vDefs, vOpts] = extractGenerics(element);

    methods.push({
      method,
      validationDefinitions: extractValidationDefinitions(
        route,
        method,
        sourceFile,
        vDefs,
        vOpts,
      ),
    });
  }

  return methods;
};

const literalOf = (typeNode: AstNode | undefined) => {
  return typeNode?.type === "TSLiteralType" ? typeNode.literal : undefined;
};

const extractStringLiteral = (typeNode: AstNode | undefined) => {
  const literal = literalOf(typeNode);
  return typeof literal?.value === "string"
    ? (literal.value as string)
    : undefined;
};

const parseRuntimeValidation = (typeNode: AstNode | undefined) => {
  const literal = literalOf(typeNode);
  return typeof literal?.value === "boolean"
    ? (literal.value as boolean)
    : undefined;
};

const typeOfMember = (member: AstNode): AstNode | undefined => {
  return member.typeAnnotation?.typeAnnotation;
};

/**
 * Property name as declared, stripping quotes for string-literal keys.
 * */
const propertyName = (member: AstNode): string => {
  return member.key.type === "Literal"
    ? String(member.key.value)
    : member.key.name;
};

/**
 * A target key as written: a quoted key keeps its quotes, so it names no target.
 * */
const targetName = (member: AstNode, sourceFile: ParsedSource) => {
  return (
    member.key.type === "Identifier"
      ? member.key.name
      : textOf(sourceFile, member.key)
  ) as ValidationTarget;
};

const extractResponseVariant = (
  typeNode: AstNode,
  sourceFile: ParsedSource,
):
  | {
      status: number;
      contentType?: string | undefined;
      body?: string | undefined;
    }
  | undefined => {
  if (typeNode.type !== "TSTupleType") {
    return undefined;
  }

  // default
  let status = 200;
  let contentType: string | undefined;
  let body: string | undefined;

  const [
    //
    statusNode,
    contentTypeNode,
    bodyNode,
  ] = typeNode.elementTypes as Array<AstNode>;

  // Status (index 0) - a numeric literal type
  const statusLiteral = literalOf(statusNode);

  if (typeof statusLiteral?.value === "number") {
    status = Number(textOf(sourceFile, statusLiteral));
  }

  // ContentType (index 1) - a string literal type
  if (contentTypeNode) {
    contentType = extractStringLiteral(contentTypeNode);
  }

  // Response type text (index 2)
  if (bodyNode) {
    body = textOf(sourceFile, bodyNode);
    if (["object"].includes(body)) {
      body = "{}";
    }
  }

  return { status, contentType, body };
};

/** Parse the options TypeLiteral into a map keyed by target */
const parseValidationOptions = (
  typeNode: AstNode | undefined,
  sourceFile: ParsedSource,
) => {
  const opts: Partial<
    Record<
      ValidationTarget,
      {
        contentType: string | undefined;
        runtimeValidation: boolean | undefined;
        customErrors: Record<string, string> | undefined;
      }
    >
  > = {};

  if (typeNode?.type !== "TSTypeLiteral") {
    return opts;
  }

  for (const prop of typeNode.members as Array<AstNode>) {
    if (prop.type !== "TSPropertySignature") {
      continue;
    }

    const target = targetName(prop, sourceFile);
    const optsNode = typeOfMember(prop);

    if (optsNode?.type !== "TSTypeLiteral") {
      continue;
    }

    let contentType: string | undefined;
    let runtimeValidation: boolean | undefined;
    const customErrors: Record<string, string> = {};

    for (const member of optsNode.members as Array<AstNode>) {
      if (member.type !== "TSPropertySignature") {
        continue;
      }

      const name = propertyName(member);
      const node = typeOfMember(member);

      if (name === "contentType") {
        contentType = extractStringLiteral(node);
      } else if (name === "runtimeValidation") {
        runtimeValidation = parseRuntimeValidation(node);
      } else if (name.startsWith("error")) {
        const literal = extractStringLiteral(node);
        if (literal) {
          customErrors[name] = literal;
        }
      }
    }

    opts[target] = { contentType, runtimeValidation, customErrors };
  }

  return opts;
};

/**
 * Validation definitions from a method's generics:
 * the definitions (schemas) merged with the options, one entry per target.
 * */
const extractValidationDefinitions = (
  route: Pick<ApiRoute, "id" | "name">,
  method: HTTPMethod,
  sourceFile: ParsedSource,
  defsNode: AstNode | undefined,
  optsNode: AstNode | undefined,
) => {
  const definitions: Array<ValidationDefinition> = [];

  if (defsNode?.type !== "TSTypeLiteral") {
    return definitions;
  }

  const optsMap = parseValidationOptions(optsNode, sourceFile);

  const createId = (target: string, hash?: string) => {
    return [
      target.replace(/^./, (c) => c.toUpperCase()),
      "T",
      method,
      crc(route.id + hash),
    ].join("");
  };

  for (const prop of defsNode.members as Array<AstNode>) {
    if (prop.type !== "TSPropertySignature") {
      continue;
    }

    const target = targetName(prop, sourceFile);

    const typeNode = typeOfMember(prop);

    if (!typeNode) {
      throw new Error(`${route.name}: "${target}" has no type`);
    }

    if (target === "response") {
      const variants =
        typeNode.type === "TSUnionType"
          ? (typeNode.types as Array<AstNode>).filter((t) => {
              return t.type === "TSTupleType";
            })
          : [typeNode];

      definitions.push({
        ...optsMap[target],
        method,
        target,
        variants: variants.flatMap((e) => {
          const { status, contentType, body } = {
            ...extractResponseVariant(e, sourceFile),
          };

          if (!status) {
            return [];
          }

          return [
            {
              id: createId(target, JSON.stringify([status, contentType, body])),
              status,
              contentType,
              body,
            },
          ];
        }),
      });
    } else if (Object.keys(RequestValidationTargets).includes(target)) {
      definitions.push({
        ...optsMap[target],
        method,
        target,
        schema: {
          id: createId(target),
          text: textOf(sourceFile, typeNode),
        },
      } as ValidationDefinition);
    }
  }

  return definitions;
};
