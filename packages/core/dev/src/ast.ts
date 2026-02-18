import { resolve } from "node:path";
import { styleText } from "node:util";

import crc from "crc/crc32";
import { flattener } from "tfusion";
import {
  type CallExpression,
  type Identifier,
  Project,
  type ProjectOptions,
  type SourceFile,
  SyntaxKind,
  type TypeNode,
} from "ts-morph";

import {
  type HTTPMethod,
  HTTPMethods,
  RequestValidationTargets,
  type ValidationTarget,
} from "@kosmojs/api";

import type {
  ApiRoute,
  PluginOptionsResolved,
  TypeDeclaration,
  ValidationDefinition,
} from "./types";

type PathResolver = (path: string) => string;

export const createProject = (opts?: ProjectOptions) => new Project(opts);

export const resolveRouteSignature = async (
  route: Pick<ApiRoute, "id" | "name" | "fileFullpath" | "optionalParams">,
  opts?: {
    relpathResolver?: PathResolver;
    sourceFile?: SourceFile;
    withReferencedFiles?: boolean;
  },
) => {
  const {
    sourceFile = createProject().addSourceFileAtPath(route.fileFullpath),
  } = { ...opts };

  const [typeDeclarations, referencedFiles] = extractTypeDeclarations(
    sourceFile,
    opts,
  );

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
    referencedFiles,
  };
};

export const extractDefaultExport = (
  sourceFile: SourceFile,
): CallExpression | undefined => {
  const [defaultExport] = sourceFile
    .getExportAssignments()
    .flatMap((exportAssignment) => {
      if (exportAssignment.isExportEquals()) {
        return [];
      }
      const callExpression = exportAssignment.getExpression();
      return callExpression.isKind(SyntaxKind.CallExpression)
        ? [callExpression]
        : [];
    });
  return defaultExport;
};

export const extractParamsRefinements = (
  callExpression: CallExpression,
): Array<{ index: number; text: string }> | undefined => {
  const [paramsGeneric] = extractGenerics(callExpression);

  if (!paramsGeneric?.isKind(SyntaxKind.TupleType)) {
    return;
  }

  return paramsGeneric.getElements().map((node, index) => {
    return {
      index,
      text: node.getText(),
    };
  });
};

export const extractRouteMethods = (
  route: Pick<ApiRoute, "id" | "name">,
  callExpression: CallExpression,
): Array<{
  method: HTTPMethod;
  validationDefinitions: Array<ValidationDefinition>;
}> => {
  const funcDeclaration =
    callExpression.getFirstChildByKind(SyntaxKind.ArrowFunction) ||
    callExpression.getFirstChildByKind(SyntaxKind.FunctionExpression);

  if (!funcDeclaration) {
    return [];
  }

  const arrayLiteralExpression = funcDeclaration.getFirstChildByKind(
    SyntaxKind.ArrayLiteralExpression,
  );

  if (!arrayLiteralExpression) {
    return [];
  }

  const callExpressions: Array<[CallExpression, HTTPMethod]> = [];

  for (const e of arrayLiteralExpression.getChildrenOfKind(
    SyntaxKind.CallExpression,
  )) {
    const name = e.getExpression().getText() as HTTPMethod;
    if (HTTPMethods[name]) {
      callExpressions.push([e, name]);
    }
  }

  const methods: ReturnType<typeof extractRouteMethods> = [];

  for (const [callExpression, method] of callExpressions) {
    const [vDefs, vOpts] = extractGenerics(callExpression);
    methods.push({
      method,
      validationDefinitions: extractValidationDefinitions(
        route,
        method,
        vDefs,
        vOpts,
      ),
    });
  }

  return methods;
};

/** Parse a boolean literal type node */
const parseRuntimeValidation = (typeNode: TypeNode) => {
  if (typeNode.isKind(SyntaxKind.LiteralType)) {
    const literal = typeNode.getFirstChild();
    if (literal?.isKind(SyntaxKind.TrueKeyword)) {
      return true;
    } else if (literal?.isKind(SyntaxKind.FalseKeyword)) {
      return false;
    }
  }
  return undefined;
};

const extractResponseVariant = (
  typeNode: TypeNode,
):
  | {
      status: number;
      contentType?: string | undefined;
      body?: string | undefined;
    }
  | undefined => {
  if (!typeNode.isKind(SyntaxKind.TupleType)) {
    return;
  }

  let status = 200; // default
  let contentType: string | undefined;
  let body: string | undefined;

  const [statusNode, contentTypeNode, bodyNode] = typeNode.getElements();

  // Status (index 0) - should be a LiteralType with NumericLiteral
  if (statusNode?.isKind(SyntaxKind.LiteralType)) {
    const literal = statusNode.getFirstChildByKind(SyntaxKind.NumericLiteral);
    if (literal) {
      status = Number(literal.getText());
    }
  }

  // ContentType (index 1) - should be a LiteralType with StringLiteral
  if (contentTypeNode) {
    contentType = extractStringLiteral(contentTypeNode);
  }

  // Response type text (index 2)
  if (bodyNode) {
    body = bodyNode.getText();
    if (["object"].includes(body)) {
      body = "{}";
    }
  }

  return { status, contentType, body };
};

/** Parse opts TypeLiteral into a map keyed by target */
const parseValidationOptions = (typeNode: TypeNode | undefined) => {
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

  if (!typeNode?.isKind(SyntaxKind.TypeLiteral)) {
    return opts;
  }

  for (const prop of typeNode.getMembers()) {
    if (!prop.isKind(SyntaxKind.PropertySignature)) {
      continue;
    }

    const target = prop.getName() as ValidationTarget;
    const typeNode = prop.getTypeNodeOrThrow();

    if (!typeNode.isKind(SyntaxKind.TypeLiteral)) {
      continue;
    }

    let contentType: string | undefined;
    let runtimeValidation: boolean | undefined;
    const customErrors: Record<string, string> = {};

    for (const member of typeNode.getMembers()) {
      if (!member.isKind(SyntaxKind.PropertySignature)) {
        continue;
      }

      const nameNode = member.getNameNode();
      const valueNode = member.getTypeNodeOrThrow();

      const name = nameNode.isKind(SyntaxKind.StringLiteral)
        ? nameNode.getLiteralText() // No quotes
        : nameNode.getText(); // Regular identifier

      if (name === "contentType") {
        contentType = extractStringLiteral(valueNode);
      } else if (name === "runtimeValidation") {
        runtimeValidation = parseRuntimeValidation(valueNode);
      } else if (name.startsWith("error")) {
        const literal = extractStringLiteral(valueNode);
        if (literal) {
          customErrors[name] = literal;
        }
      }
    }

    opts[target] = {
      contentType,
      runtimeValidation,
      customErrors,
    };
  }

  return opts;
};

const extractStringLiteral = (typeNode: TypeNode) => {
  const literal = typeNode.isKind(SyntaxKind.LiteralType)
    ? typeNode.getFirstChildByKind(SyntaxKind.StringLiteral)
    : undefined;
  return literal ? literal.getLiteralText() : undefined;
};

/**
 * Extract validation definitions from route handler generics.
 * Merges defs (schemas) and opts (validation options) into a flat array.
 * */
export const extractValidationDefinitions = (
  route: Pick<ApiRoute, "id" | "name">,
  method: HTTPMethod,
  defsNode: TypeNode,
  optsNode: TypeNode | undefined,
) => {
  const definitions: Array<ValidationDefinition> = [];

  if (!defsNode?.isKind(SyntaxKind.TypeLiteral)) {
    return definitions;
  }

  const optsMap = parseValidationOptions(optsNode);

  const createId = (target: string, hash?: string) => {
    return [
      target.replace(/^./, (c) => c.toUpperCase()),
      "T",
      method,
      crc(route.id + hash),
    ].join("");
  };

  for (const prop of defsNode.getMembers()) {
    if (!prop.isKind(SyntaxKind.PropertySignature)) {
      continue;
    }

    const target = prop.getName() as ValidationTarget;
    const typeNode = prop.getTypeNodeOrThrow();

    if (target === "response") {
      const variants = typeNode.isKind(SyntaxKind.UnionType)
        ? typeNode.getChildrenOfKind(SyntaxKind.TupleType)
        : [typeNode];
      definitions.push({
        ...optsMap[target],
        method,
        target,
        variants: variants.flatMap((e, i) => {
          const { status, contentType, body } = extractResponseVariant(e) || {};

          if (!status) {
            return [];
          }

          if (contentType && typeof contentType !== "string") {
            console.warn(
              styleText(
                ["bold", "red"],
                `✗ The second element of a response variant should specify the Response Content Type`,
              ),
            );
            console.warn(
              styleText(["blue"], `  Example: [200, "json", Schema]`),
            );
            console.warn(
              `  Route: ${route.name}; Method: ${method}; Response Variant: #${i}`,
            );
            console.warn();
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
          text: typeNode.getText(),
        },
      });
    }
  }

  return definitions;
};

export const extractTypeDeclarations = (
  sourceFile: SourceFile,
  opts?: {
    relpathResolver?: PathResolver;
    withReferencedFiles?: boolean;
  },
): [d: Array<TypeDeclaration>, f?: Array<string>] => {
  const declarations: Array<TypeDeclaration> = [];

  const referencedFiles: Array<string> | undefined = opts?.withReferencedFiles
    ? []
    : undefined;

  for (const declaration of sourceFile.getImportDeclarations()) {
    const modulePath = declaration.getModuleSpecifierValue();

    const path = /^\.\.?\/?/.test(modulePath)
      ? opts?.relpathResolver
        ? opts.relpathResolver(modulePath)
        : modulePath
      : modulePath;

    const typeOnlyDeclaration = declaration.isTypeOnly();

    const defaultImport = typeOnlyDeclaration
      ? declaration.getDefaultImport()
      : undefined;

    if (defaultImport) {
      const name = defaultImport.getText();
      const text = `import type ${name} from "${path}";`;
      declarations.push({
        importDeclaration: {
          name,
          path,
        },
        text,
      });
      if (referencedFiles) {
        referencedFiles.push(...getReferencedFiles(defaultImport));
      }
    }

    for (const namedImport of declaration.getNamedImports()) {
      if (namedImport.isTypeOnly() || typeOnlyDeclaration) {
        const nameNode = namedImport.getNameNode();
        const name = nameNode.getText();
        const alias = namedImport.getAliasNode()?.getText();
        const nameText = alias ? `${name} as ${alias}` : name;

        declarations.push({
          importDeclaration: {
            name,
            alias,
            path,
          },
          text: `import type { ${nameText} } from "${path}";`,
        });

        if (referencedFiles) {
          if (nameNode.isKind(SyntaxKind.Identifier)) {
            referencedFiles.push(...getReferencedFiles(nameNode));
          }
        }
      }
    }
  }

  for (const declaration of sourceFile.getTypeAliases()) {
    const name = declaration.getName();
    const text = declaration.getFullText().trim();
    declarations.push({
      typeAliasDeclaration: { name },
      text,
    });
  }

  for (const declaration of sourceFile.getInterfaces()) {
    const name = declaration.getName();
    const text = declaration.getFullText().trim();
    declarations.push({
      interfaceDeclaration: { name },
      text,
    });
  }

  for (const declaration of sourceFile.getEnums()) {
    const name = declaration.getName();
    const text = declaration.getFullText().trim();
    declarations.push({
      enumDeclaration: { name },
      text,
    });
  }

  for (const declaration of sourceFile.getExportDeclarations()) {
    const typeOnlyDeclaration = declaration.isTypeOnly();

    const modulePath = declaration.getModuleSpecifierValue();

    const path = modulePath
      ? /^\.\.?\/?/.test(modulePath)
        ? opts?.relpathResolver
          ? opts.relpathResolver(modulePath)
          : modulePath
        : modulePath
      : undefined;

    for (const namedExport of declaration.getNamedExports()) {
      if (namedExport.isTypeOnly() || typeOnlyDeclaration) {
        const nameNode = namedExport.getNameNode();
        const name = nameNode.getText();
        const alias = namedExport.getAliasNode()?.getText();
        const nameText = alias ? `${name} as ${alias}` : name;

        declarations.push({
          exportDeclaration: {
            name,
            alias: alias ?? name,
            path,
          },
          text: path
            ? `export type { ${nameText} } from "${path}";`
            : `export type { ${nameText} };`,
        });

        if (referencedFiles) {
          if (nameNode.isKind(SyntaxKind.Identifier)) {
            referencedFiles.push(...getReferencedFiles(nameNode));
          }
        }
      }
    }
  }

  return referencedFiles
    ? [declarations, [...new Set<string>(referencedFiles)]]
    : [declarations];
};

const getReferencedFiles = (importIdentifier: Identifier): Array<string> => {
  // ambient modules may have declarations in multiple files
  const declarations =
    importIdentifier //
      ?.getSymbol()
      ?.getAliasedSymbol()
      ?.getDeclarations() || [];

  return declarations.flatMap((e) => {
    const sourceFile = e.getSourceFile();
    return sourceFile //
      ? [sourceFile.getFilePath()]
      : [];
  });
};

const extractGenerics = (callExpression: CallExpression) => {
  return callExpression.getTypeArguments();
};

export const typeResolverFactory = ({ appRoot }: PluginOptionsResolved) => {
  const project = createProject({
    tsConfigFilePath: resolve(appRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  const literalTypesResolver = (
    literalTypes: string,
    options: Parameters<typeof flattener>[2],
  ) => {
    const sourceFile = project.createSourceFile(
      `${crc(literalTypes)}-${Date.now()}.ts`,
      literalTypes,
      { overwrite: true },
    );

    const resolvedTypes = flattener(project, sourceFile, {
      ...options,
      stripComments: true,
    });

    project.removeSourceFile(sourceFile);

    return resolvedTypes;
  };

  return {
    getSourceFile: (fileFullpath: string) => {
      return (
        project.getSourceFile(fileFullpath) ||
        project.addSourceFileAtPath(fileFullpath)
      );
    },
    refreshSourceFile: async (fileFullpath: string) => {
      const sourceFile = project.getSourceFile(fileFullpath);
      if (sourceFile) {
        await sourceFile.refreshFromFileSystem();
      }
    },
    literalTypesResolver,
  };
};
