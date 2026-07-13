export const escapeTemplateLiterals = (origin: string) => {
  return [
    // Escape backticks for safe use in template literals
    [/(?<!\\)`/g, "\\`"],
    // Escape $ for safe use in template literals
    [/(?<!\\)\$\{/g, "\\${"],
  ].reduce((text, [a, b]) => text.replace(a, b as never), origin);
};
