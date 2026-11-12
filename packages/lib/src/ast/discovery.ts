import { readFileSync } from "node:fs";
import { dirname } from "node:path";

import crc from "crc/crc32";
import { ResolverFactory } from "oxc-resolver";
import Type from "typebox";

import {
  type AstNode,
  childrenOf,
  type ParsedSource,
  parseSource,
  walk,
} from "./parse";

const DECLARATIONS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSEnumDeclaration",
]);

// nodes naming a type: `Foo`, `NS.Foo`, `interface X extends Foo`
const REFERENCES = new Set([
  "TSTypeReference",
  "TSInterfaceHeritage",
  "TSClassImplements",
]);

type ImportBinding = {
  request: string;
  // the exported name, "default", or "*" for a namespace import
  imported: string;
};

type ExportBinding = { local: string } | { request: string; imported: string };

/**
 * A parsed file, indexed for discovery: its type declarations by name,
 * what each local name is imported as, and what the file exports.
 * */
type Module = ParsedSource & {
  declarations: Map<string, AstNode>;
  imports: Map<string, ImportBinding>;
  exports: Map<string, ExportBinding>;
  stars: Array<string>;
};

const indexModule = (parsed: ParsedSource): Module => {
  const declarations = new Map<string, AstNode>();

  for (const node of parsed.program.body) {
    const decl = DECLARATIONS.has(node.type)
      ? node
      : DECLARATIONS.has(node.declaration?.type)
        ? node.declaration
        : undefined;
    if (decl) {
      declarations.set(decl.id.name, decl);
    }
  }

  const imports = new Map<string, ImportBinding>();

  for (const imp of parsed.module.staticImports) {
    for (const entry of imp.entries) {
      const imported =
        entry.importName.kind === "Name"
          ? (entry.importName.name as string)
          : entry.importName.kind === "Default"
            ? "default"
            : "*";
      imports.set(entry.localName.value, {
        request: imp.moduleRequest.value,
        imported,
      });
    }
  }

  const exports = new Map<string, ExportBinding>();
  const stars: Array<string> = [];

  for (const exp of parsed.module.staticExports) {
    for (const entry of exp.entries) {
      if (entry.importName.kind === "AllButDefault" && entry.moduleRequest) {
        stars.push(entry.moduleRequest.value);
      } else if (entry.moduleRequest && entry.importName.name) {
        exports.set(entry.exportName.name ?? "default", {
          request: entry.moduleRequest.value,
          imported: entry.importName.name,
        });
      } else if (entry.exportName.kind === "Default" && entry.localName.name) {
        exports.set("default", { local: entry.localName.name });
      } else if (entry.exportName.name) {
        exports.set(entry.exportName.name, {
          local: entry.localName.name ?? entry.exportName.name,
        });
      }
    }
  }

  return { ...parsed, declarations, imports, exports, stars };
};

/**
 * The names a declaration refers to: `Foo`, or `NS.Foo` for a qualified name.
 * */
const referencedNames = (decl: AstNode) => {
  const names = new Set<string>();

  walk(decl, (node) => {
    if (!REFERENCES.has(node.type)) {
      return;
    }

    let name = node.typeName ?? node.expression;
    const path: Array<string> = [];

    while (name?.type === "TSQualifiedName") {
      path.unshift(name.right.name);
      name = name.left;
    }

    if (name?.type === "Identifier") {
      names.add(path.length ? `${name.name}.${path.join(".")}` : name.name);
    }
  });

  return names;
};

/**
 * Type parameters in scope inside a declaration -
 * its own, and those of nested generics, mapped types and `infer` clauses.
 * */
const typeParameters = (decl: AstNode) => {
  const names = new Set<string>();

  walk(decl, (node) => {
    if (node.type === "TSTypeParameter") {
      names.add(node.name.name);
    }
  });

  return names;
};

export type DiscoveryOptions = {
  // path aliases, as the tsconfig `paths` of the project map them
  alias: Record<string, Array<string>>;
  // the VRefine name
  refineTypeName: string;
};

export type DiscoveryResult = {
  // what each requested name evaluates to, plain JSON Schema
  schemas: Record<string, Record<string, unknown>>;
  // every file the requested names reach, the entry included
  files: Array<string>;
  // what could not be followed: unresolvable imports, missing exports, cycles
  problems: Array<string>;
};

/**
 * Discovers the types a set of names needs, across files,
 * and evaluates them with TypeBox Script.
 *
 * Discovery is syntactic: oxc-parser reads each file's declarations,
 * imports and exports, oxc-resolver resolves the import paths,
 * and only the declarations the names reach are collected -
 * a file's other declarations are never looked at.
 *
 * Each file's collected declarations are evaluated as one Script module,
 * dependencies first, with the names the file imports bound as context
 * under the local names it uses.
 * Script does the rest: generics, utility types,
 * mapped and conditional types, recursion (as `$defs`).
 * */
export const discoveryFactory = ({
  alias,
  refineTypeName,
}: DiscoveryOptions) => {
  const resolver = new ResolverFactory({
    alias,
    extensions: [".ts", ".tsx", ".d.ts", ".mts", ".cts"],
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
    conditionNames: ["types", "import", "default"],
  });

  // parsed files by path, reused while their content is unchanged
  const parsed = new Map<string, { hash: number; module: Module }>();

  const load = (file: string, source?: string) => {
    const text = source ?? readFileSync(file, "utf8");
    const hash = crc(text);
    const cached = parsed.get(file);
    if (cached?.hash === hash) {
      return cached.module;
    }
    const module = indexModule(parseSource(file, text));
    parsed.set(file, { hash, module });
    return module;
  };

  const discover = (
    entry: { file: string; source: string },
    names: Array<string>,
  ): DiscoveryResult => {
    const problems: Array<string> = [];
    const files = new Set<string>([entry.file]);

    // per call: what is needed of each file, and what its imports bind to
    type Unit = {
      module: Module;
      needed: Set<string>;
      context: Map<string, { unit: Unit; local: string }>;
    };

    const units = new Map<string, Unit>();

    const unitOf = (module: Module): Unit => {
      let unit = units.get(module.file);

      if (!unit) {
        unit = { module, needed: new Set(), context: new Map() };
        units.set(module.file, unit);
      }

      return unit;
    };

    const follow = (from: Unit, request: string): Unit | undefined => {
      const { path, error } = resolver.sync(dirname(from.module.file), request);

      if (!path) {
        problems.push(
          `cannot resolve "${request}" from ${from.module.file}: ${error}`,
        );
        return undefined;
      }

      files.add(path);

      try {
        return unitOf(load(path));
      } catch (error) {
        problems.push((error as Error).message);
        return undefined;
      }
    };

    // where an exported name of a file is declared, through re-exports
    const findExport = (
      unit: Unit,
      name: string,
      seen = new Set<string>(),
    ): [Unit, string] | undefined => {
      const key = `${unit.module.file}#${name}`;

      if (seen.has(key)) {
        return undefined;
      }

      seen.add(key);

      const binding = unit.module.exports.get(name);

      if (binding && "local" in binding) {
        return [unit, binding.local];
      }

      if (binding) {
        const target = follow(unit, binding.request);
        return target ? findExport(target, binding.imported, seen) : undefined;
      }

      for (const request of unit.module.stars) {
        const target = follow(unit, request);
        const found = target ? findExport(target, name, seen) : undefined;
        if (found) {
          return found;
        }
      }

      return undefined;
    };

    const need = (unit: Unit, name: string) => {
      const [head = "", ...member] = name.split(".");

      const decl = unit.module.declarations.get(head);

      if (decl) {
        if (unit.needed.has(head)) {
          return;
        }
        unit.needed.add(head);
        const scope = typeParameters(decl);
        for (const ref of referencedNames(decl)) {
          if (!scope.has(ref.split(".")[0] as string)) {
            need(unit, ref);
          }
        }
        return;
      }

      const binding = unit.module.imports.get(head);

      if (!binding) {
        // a builtin, or a name Script resolves on its own; an unknown one
        // stays a `$ref` in the schema, for the build-time check to report
        return;
      }

      const target = follow(unit, binding.request);

      if (!target) {
        return;
      }

      // `NS.Foo.Bar` of a namespace import is `Foo.Bar` of the module;
      // `Foo.Bar` of a named import is the member `Bar` of `Foo`, an enum's
      const [
        //
        exported = "",
        ...rest
      ] = binding.imported === "*" ? member : [binding.imported, ...member];

      const found = findExport(target, exported);

      if (!found) {
        problems.push(
          `${unit.module.file}: "${exported}" is not exported by "${binding.request}"`,
        );
        return;
      }

      const [declUnit, local] = found;

      need(declUnit, local);

      unit.context.set(name, {
        unit: declUnit,
        local: [local, ...rest].join("__"),
      });
    };

    const entryUnit = unitOf(load(entry.file, entry.source));

    for (const name of names) {
      need(entryUnit, name);
    }

    const evaluated = new Map<Unit, Record<string, unknown>>();

    const evaluate = (
      unit: Unit,
      stack: Array<Unit> = [],
    ): Record<string, unknown> => {
      const done = evaluated.get(unit);

      if (done) {
        return done;
      }

      if (stack.includes(unit)) {
        problems.push(
          `import cycle: ${[...stack, unit].map((u) => u.module.file).join(" -> ")}`,
        );
        return {};
      }

      const context: Record<string, unknown> = {};

      for (const [name, { unit: dep, local }] of unit.context) {
        const schema = evaluate(dep, [...stack, unit])[local];
        if (schema) {
          context[name.replaceAll(".", "__")] = schema;
        }
      }

      const text = scriptText(
        unit.module,
        unit.needed,
        refineTypeName,
        problems,
      );

      const module = text
        ? (Type.Script(context as never, text) as unknown as Record<
            string,
            unknown
          >)
        : {};

      evaluated.set(unit, module);

      return module;
    };

    const module = evaluate(entryUnit);

    const schemas: DiscoveryResult["schemas"] = {};

    for (const name of names) {
      const schema = module[name];
      if (schema) {
        // plain JSON: TypeBox schemas carry symbol-keyed metadata
        schemas[name] = JSON.parse(JSON.stringify(schema));
      }
    }

    return { schemas, files: [...files], problems };
  };

  return { discover };
};

/**
 * The needed declarations of a file as Script text, rendered from the AST:
 * every node is its source with its children rendered in place, comments dropped,
 * except where Script reads TypeScript differently.
 * */
const scriptText = (
  module: Module,
  needed: Set<string>,
  refineTypeName: string,
  problems: Array<string>,
) => {
  const { source, comments } = module;

  // source between two children, comments removed
  const gap = (from: number, to: number) => {
    let text = "";
    let at = from;
    for (const comment of comments) {
      if (comment.end <= from || comment.start >= to) {
        continue;
      }
      text += source.slice(at, Math.max(at, comment.start));
      at = Math.min(to, comment.end);
    }
    return text + source.slice(at, to);
  };

  const splice = (node: AstNode) => {
    let text = "";
    let at = node.start;
    for (const child of childrenOf(node)) {
      text += gap(at, child.start) + render(child);
      at = child.end;
    }
    return text + gap(at, node.end);
  };

  const render = (node: AstNode): string => {
    // VRefine<T, O> -> ((T) with O): `with` binds tighter than `&` and `|`,
    // and a chain of `with` clauses needs the parentheses too
    if (
      node.type === "TSTypeReference" &&
      node.typeName.type === "Identifier" &&
      node.typeName.name === refineTypeName &&
      node.typeArguments?.params.length === 2
    ) {
      const [inner, opts] = node.typeArguments.params;
      return `((${render(inner)}) with ${render(opts)})`;
    }

    // Script takes the text between the quotes as the value, escapes unprocessed:
    // "\\d" in the source is two characters to Script,
    // the one-backslash regex escape to TypeScript.
    // The literal is written as its value.
    if (node.type === "Literal" && typeof node.value === "string") {
      const quote = [`"`, `'`].find((q) => !node.value.includes(q));
      if (!quote) {
        problems.push(
          `${module.file}: a string literal holding both quote characters is kept as written`,
        );
        return source.slice(node.start, node.end);
      }
      return `${quote}${node.value}${quote}`;
    }

    // NS.Type -> NS__Type, bound in the context; Script has no qualified names
    if (node.type === "TSQualifiedName") {
      return source.slice(node.start, node.end).replaceAll(".", "__");
    }

    // Index signatures become records: Script leaves a `with` clause
    // in an index signature value unevaluated, while a record value is evaluated.
    // A literal mixing properties and index signatures becomes their intersection,
    // which validates the same - the record patterns check the properties too.
    if (
      node.type === "TSTypeLiteral" &&
      (node.members as Array<AstNode>).some(
        (m) => m.type === "TSIndexSignature",
      )
    ) {
      const members: Array<string> = [];
      const records: Array<string> = [];

      for (const member of node.members as Array<AstNode>) {
        if (member.type === "TSIndexSignature") {
          const keyType = member.parameters[0].typeAnnotation.typeAnnotation;
          const value = member.typeAnnotation?.typeAnnotation;
          records.push(
            `Record<${render(keyType)}, ${value ? render(value) : "unknown"}>`,
          );
        } else {
          members.push(render(member).replace(/[;,]\s*$/, ""));
        }
      }

      if (!members.length && records.length === 1) {
        return records[0] as string;
      }

      const constituents = [
        ...(members.length ? [`{ ${members.join(", ")} }`] : []),
        ...records,
      ];

      return `(${constituents.map((c) => `(${c})`).join(" & ")})`;
    }

    // an enum, which Script does not read, as the union of its values;
    // each member also as its own type, for `Enum.Member` (rendered `Enum__Member`)
    if (node.type === "TSEnumDeclaration") {
      const name = node.id.name;
      const values: Array<string> = [];

      let next = 0;

      for (const member of node.body?.members ?? node.members ?? []) {
        const init = member.initializer;
        let value: string;

        if (init?.type === "Literal" && typeof init.value === "string") {
          value = JSON.stringify(init.value);
        } else if (init?.type === "Literal" && typeof init.value === "number") {
          next = init.value + 1;
          value = String(init.value);
        } else if (!init) {
          value = String(next++);
        } else {
          problems.push(
            `${module.file}: enum ${name} has a computed member, typed unknown`,
          );
          value = "unknown";
        }

        const memberName = member.id.name ?? member.id.value;

        values.push(`type ${name}__${memberName} = ${value}`);
      }

      const union = values.map((v) => v.slice(v.indexOf("= ") + 2));

      return [
        `type ${name} = ${union.length ? union.join(" | ") : "never"}`,
        ...values,
      ].join("\n");
    }

    return splice(node);
  };

  return [...needed]
    .map((name) => module.declarations.get(name) as AstNode)
    .map(render)
    .join("\n");
};
