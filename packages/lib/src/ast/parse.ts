import { readFileSync } from "node:fs";

import { type Comment, type EcmaScriptModule, parseSync } from "oxc-parser";

/**
 * A node of oxc's ESTree, read structurally:
 * the walkers only look at `type`, the span and the fields of the kinds they know.
 * */
// biome-ignore lint/suspicious/noExplicitAny: the AST is walked generically, by node kind
type NodeFields = Record<string, any>;

export type AstNode = { type: string; start: number; end: number } & NodeFields;

export type ParsedSource = {
  file: string;
  source: string;
  program: { body: Array<AstNode> };
  module: EcmaScriptModule;
  comments: Array<Comment>;
};

/**
 * Parses a TypeScript file - from disk, or from the given source.
 * A syntax error throws, naming the file and the first error.
 * */
export const parseSource = (file: string, source?: string): ParsedSource => {
  const text = source ?? readFileSync(file, "utf8");
  const lang = /\.[cm]?tsx$/.test(file) ? "tsx" : "ts";

  const { program, module, comments, errors } = parseSync(file, text, { lang });

  if (errors.length) {
    throw new Error(`${file}: ${errors[0]?.message}`);
  }

  return {
    file,
    source: text,
    program: program as unknown as ParsedSource["program"],
    module,
    comments,
  };
};

/**
 * The source text of a node.
 * */
export const textOf = (
  { source }: Pick<ParsedSource, "source">,
  node: AstNode,
) => {
  return source.slice(node.start, node.end);
};

/**
 * The AST nodes directly under a node, in source order.
 * */
export const childrenOf = (node: AstNode): Array<AstNode> => {
  const out: Array<AstNode> = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent" || !value || typeof value !== "object") {
      continue;
    }
    for (const child of Array.isArray(value) ? value : [value]) {
      if (
        child &&
        typeof child.type === "string" &&
        typeof child.start === "number"
      ) {
        out.push(child);
      }
    }
  }

  return out.sort((a, b) => a.start - b.start);
};

/**
 * Visits a node and everything below it, depth first.
 * Returning `false` from the visitor skips the node's children.
 * */
export const walk = (
  node: AstNode | undefined,
  visitor: (node: AstNode) => boolean | undefined | void,
) => {
  if (!node) {
    return;
  }
  if (visitor(node) === false) {
    return;
  }
  for (const child of childrenOf(node)) {
    walk(child, visitor);
  }
};
