export type Options = [
  {
    /**
     * Controls which dependencies are bundled into the output.
     * By default, all dependencies are externalized.
     * Use `noExternal: true` to bundle all dependencies.
     * */
    external?: true | Array<string>;
    noExternal?: true | string | RegExp | Array<string | RegExp>;
  },
  false,
];
