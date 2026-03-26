export type Options = {
  // Custom templates map
  templates?: Record<
    // page name pattern
    string,
    // template itself, not path to template file
    string
  >;
};
