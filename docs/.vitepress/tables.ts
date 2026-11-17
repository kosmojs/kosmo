import type { MarkdownRenderer } from "vitepress";

type Token = ReturnType<MarkdownRenderer["parse"]>[number];

/*
  Markdown tables, reshaped for reading as spec matrices.

  - Every table is wrapped in a scroll box (`.kx-table`). The wrapper draws
    the frame and scrolls a wide table; the table inside fills the measure,
    so its header band and row stripes run the full width of the frame.
  - A table with five or more columns is marked `.kx-table--wide`: its
    first column pins to the left edge while the rest scrolls under it.
  - Column alignment from the `:---:` markers is dropped. Every cell reads
    from the same left edge, so wrapped values stay scannable.
  - Status emoji in cells become small drawn badges (yes / partial / no),
    which look the same on every OS and carry an accessible name. Any text
    after the emoji stays as written.
*/

const WIDE_FROM = 5;

// written as escapes so the source stays plain ASCII: check, warning, cross
const STATUS: Array<[RegExp, string, string]> = [
  [/^\u2705/, "yes", "yes"],
  [/^\u26a0\ufe0f?/, "partial", "partial"],
  [/^\u274c/, "no", "no"],
];

const badge = (kind: string, label: string) => {
  return `<span class="kx-st kx-st--${kind}" role="img" aria-label="${label}"></span>`;
};

const columnCount = (tokens: Token[], from: number) => {
  let count = 0;
  for (let i = from + 1; i < tokens.length; i += 1) {
    const type = tokens[i].type;
    if (type === "th_open") {
      count += 1;
    }
    if (type === "tr_close") {
      break;
    }
  }
  return count;
};

export const tablesPlugin = (md: MarkdownRenderer) => {
  md.renderer.rules.table_open = (tokens, idx, options, _env, self) => {
    const wide = columnCount(tokens, idx) >= WIDE_FROM;
    const cls = wide ? "kx-table kx-table--wide" : "kx-table";
    return `<div class="${cls}">\n${self.renderToken(tokens, idx, options)}`;
  };

  md.renderer.rules.table_close = (tokens, idx, options, _env, self) => {
    return `${self.renderToken(tokens, idx, options)}</div>\n`;
  };

  md.core.ruler.push("kx_table_cells", (state) => {
    let inTable = false;

    for (const token of state.tokens) {
      if (token.type === "table_open") {
        inTable = true;
      } else if (token.type === "table_close") {
        inTable = false;
      }

      if (!inTable) {
        continue;
      }

      if (token.type === "th_open" || token.type === "td_open") {
        const style = token.attrIndex("style");
        if (style >= 0) {
          token.attrs?.splice(style, 1);
        }
        continue;
      }

      if (token.type !== "inline" || !token.children) {
        continue;
      }

      const children: Token[] = [];

      for (const child of token.children) {
        const match =
          child.type === "text"
            ? STATUS.find(([re]) => re.test(child.content))
            : undefined;

        if (!match) {
          children.push(child);
          continue;
        }

        const [re, kind, label] = match;
        const html = new state.Token("html_inline", "", 0);
        html.content = badge(kind, label);
        children.push(html);

        // the badge carries its own gap, so drop the space that followed the emoji
        const rest = child.content.replace(re, "").replace(/^\s+/, "");
        if (rest) {
          child.content = rest;
          children.push(child);
        }
      }

      token.children = children;
    }
  });
};
