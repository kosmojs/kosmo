import { readFile } from "node:fs/promises";

import { parse as dotenv } from "dotenv";
import type { Plugin } from "vite";

import { pathExists } from "../fs";

type Entry = {
  keys: Array<string>;
  file?: string;
  defineOn?: string;
  use?: (key: string, val: string | undefined) => void;
};

export default (entries: Array<Entry>): Plugin => {
  return {
    name: "@kosmojs:definePlugin",

    async config() {
      const define: Record<string, unknown> = {};

      for (const { keys, file, defineOn = "process.env", use } of entries) {
        define[defineOn] = {};

        const fileExists = file //
          ? await pathExists(file)
          : false;

        const env = fileExists
          ? dotenv(await readFile(file as never, "utf8"))
          : process.env;

        for (const [key, val] of Object.entries(env)) {
          if (keys.includes(key)) {
            // only explicitly given keys available on client
            define[`${defineOn}.${key}`] = JSON.stringify(val);
          }
          use?.(key, val);
        }
      }

      return { define };
    },
  };
};
