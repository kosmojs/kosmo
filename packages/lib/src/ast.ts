import { styleText } from "node:util";

import crc from "crc/crc32";
import flattener, { type ResolvedType } from "tfusion";
import {
  type CallExpression,
  type Identifier,
  ModuleResolutionKind,
  Project,
  type ProjectOptions,
  type SourceFile,
  SyntaxKind,
  type TypeNode,
} from "ts-morph";

import type { ResolvedTypeSignature } from "@kosmojs/core";
import {
  type ApiRoute,
  defaults,
  RequestValidationTargets,
  type SourceFolder,
  type TypeDeclaration,
  type ValidationDefinition,
  type ValidationTarget,
} from "@kosmojs/core";
import { type HTTPMethod, HTTPMethods } from "@kosmojs/core/api";

import { escapeTemplateLiterals } from "./generic";
import { pathResolver } from "./paths";
import { render } from "./render";
import * as templates from "./templates";

type PathResolver = (path: string) => string;

export const astFactory = () => {
  const createProject = (opts?: ProjectOptions) => new Project(opts);

  const resolveRouteSignature = async (
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

  const extractDefaultExport = (
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

  const extractParamsRefinements = (
    callExpression: CallExpression,
  ): Array<{ index: number; text: string }> | undefined => {
    const [
      _routeName, // first generic - the route name
      paramsGeneric, // second generic - params refinements
    ] = extractGenerics(callExpression);

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

  const extractRouteMethods = (
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
  const extractValidationDefinitions = (
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
            const { status, contentType, body } = {
              ...extractResponseVariant(e),
            };

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
                id: createId(
                  target,
                  JSON.stringify([status, contentType, body]),
                ),
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

  const extractTypeDeclarations = (
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

      const namespaceImport = typeOnlyDeclaration
        ? declaration.getNamespaceImport()
        : undefined;

      if (namespaceImport) {
        const name = namespaceImport.getText();
        const text = `import type * as ${name} from "${path}";`;
        declarations.push({
          importDeclaration: {
            name,
            path,
          },
          text,
        });
        if (referencedFiles) {
          referencedFiles.push(...getReferencedFiles(namespaceImport));
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

  const typeResolverFactory = (sourceFolder: SourceFolder) => {
    const { createPath } = pathResolver(sourceFolder);

    const project = createProject({
      compilerOptions: {
        moduleResolution: ModuleResolutionKind.Bundler,
        types: [],
        noLib: true,
        skipLibCheck: true,
        paths: {
          [`${defaults.appPrefix}/*`]: [`${sourceFolder.root}/*`],
          [`${defaults.srcPrefix}/*`]: [createPath.src("*")],
          [`${defaults.libPrefix}/*`]: [createPath.lib("*")],
        },
      },
    });

    const withTypeboxSchema = (resolvedTypes: Array<ResolvedType>) => {
      const materializedTypes = render(templates.resolvedTypes, {
        resolvedTypes,
      });

      const sourceFile = project.createSourceFile(
        `${crc(materializedTypes)}-${Date.now()}.ts`,
        materializedTypes,
        { overwrite: true },
      );

      const types = resolvedTypes.map<ResolvedTypeSignature>((type) => {
        const typeNode = sourceFile.getTypeAlias(type.name)?.getTypeNode();

        if (!typeNode) {
          return type;
        }

        const properties = type.properties
          ? type.properties.map((prop) => {
              const propNode = typeNode.isKind(SyntaxKind.TypeLiteral)
                ? typeNode.getProperty(prop.name)?.getTypeNode()
                : undefined;

              if (!propNode) {
                return prop;
              }

              return {
                ...prop,
                typeboxSchema: renderTypeboxSchema(propNode),
              };
            })
          : undefined;

        return {
          ...type,
          ...(properties ? { properties } : {}),
          typeboxSchema: renderTypeboxSchema(typeNode),
        };
      });

      project.removeSourceFile(sourceFile);

      return types;
    };

    const literalTypesResolver = (
      literalTypes: string,
      options: Parameters<typeof flattener>[2],
    ): Array<ResolvedTypeSignature> => {
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

      return withTypeboxSchema(resolvedTypes);
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

  return {
    createProject,
    extractDefaultExport,
    extractParamsRefinements,
    extractRouteMethods,
    extractTypeDeclarations,
    resolveRouteSignature,
    typeResolverFactory,
  };
};

/**
 * Render a ts-morph TypeNode to TypeBox Script text, replacing every VRefine
 * occurrence (at any depth) with the infix `with` form.
 *
 *   VRefine<string, { format: "email" }>            ->  (string with { format: "email" })
 *   VRefine<string, { format: "email" }>[]          ->  (string with { format: "email" })[]
 *   VRefine<Array<string>, { minItems: 1 }>         ->  (Array<string> with { minItems: 1 })
 *   VRefine<Record<string, string>, { maxProperties: 20 }>
 *                                                   ->  (Record<string, string> with { maxProperties: 20 })
 *
 * The parentheses matter: for an array element the `with` clause must bind to
 * the element, not the array, so a VRefine that is the element of an array is
 * wrapped. We wrap unconditionally - harmless when not nested, required when it
 * is.
 *
 * @param typeNode   the node to render
 * @param refineTypeName the configured refine type name
 * */
const renderTypeboxSchema = (
  typeNode: TypeNode,
  refineTypeName = defaults.refineTypeName,
) => {
  const traverse = (typeNode: TypeNode): string => {
    // 1) VRefine<T, Opts> -> `(<render T> with <opts text>)`
    if (
      typeNode.isKind(SyntaxKind.TypeReference) &&
      typeNode.getTypeName().getText() === refineTypeName
    ) {
      const [inner, opts] = typeNode.getTypeArguments();
      if (!inner || !opts) {
        // Malformed VRefine, emit its raw text unchanged
        return typeNode.getText();
      }
      const innerText = traverse(inner);
      // Options is a single TypeLiteral; its raw text is exactly what `with`
      // expects. getText() preserves nested braces and quoted `}>` verbatim.
      return `(${innerText} with ${opts.getText()})`;
    }

    // 2) T[] -> `<render T>[]` (element may itself be a VRefine)
    if (typeNode.isKind(SyntaxKind.ArrayType)) {
      const element = traverse(typeNode.getElementTypeNode());
      return `${element}[]`;
    }

    // 3) Object type literal -> recurse into each property's type node
    if (typeNode.isKind(SyntaxKind.TypeLiteral)) {
      const members: string[] = [];
      for (const member of typeNode.getMembers()) {
        if (member.isKind(SyntaxKind.PropertySignature)) {
          const name = member.getName();
          const optional = member.hasQuestionToken() ? "?" : "";
          const t = member.getTypeNode();
          const rendered = t ? traverse(t) : "unknown";
          members.push(`${name}${optional}: ${rendered}`);
        } else {
          // index signatures, call signatures, etc: pass through raw
          members.push(member.getText());
        }
      }
      return `{ ${members.join(", ")} }`;
    }

    // 4) Tuple -> recurse into each element
    if (typeNode.isKind(SyntaxKind.TupleType)) {
      const elements = typeNode.getElements().map((el) => traverse(el));
      return `[${elements.join(", ")}]`;
    }

    // 5) Parenthesized -> recurse, keep the parens
    if (typeNode.isKind(SyntaxKind.ParenthesizedType)) {
      return `(${traverse(typeNode.getTypeNode())})`;
    }

    // 6) Union / Intersection -> recurse into each constituent
    if (typeNode.isKind(SyntaxKind.UnionType)) {
      return typeNode
        .getTypeNodes()
        .map((t) => traverse(t))
        .join(" | ");
    }
    if (typeNode.isKind(SyntaxKind.IntersectionType)) {
      return typeNode
        .getTypeNodes()
        .map((t) => traverse(t))
        .join(" & ");
    }

    // 7) A non-VRefine type reference that carries type arguments - this covers
    //    the refined bases Array<T> and Record<K, V> (which stay as-is and get a
    //    trailing `with` clause from case 1), as well as any generic wrapper
    //    around a VRefine. Recurse into the arguments so a nested VRefine is
    //    still rewritten, and keep the head name unchanged.
    if (typeNode.isKind(SyntaxKind.TypeReference)) {
      const args = typeNode.getTypeArguments();
      if (args.length === 0) {
        return typeNode.getText();
      }
      const name = typeNode.getTypeName().getText();
      const rendered = args.map((a) => traverse(a));
      return `${name}<${rendered.join(", ")}>`;
    }

    // 8) Anything else (primitive keyword, literal, etc): raw text is correct.
    return typeNode.getText();
  };

  return escapeTemplateLiterals(traverse(typeNode));
};
