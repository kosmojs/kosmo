import { pathTokensFactory } from "@kosmojs/lib";
import { dirname } from "node:path";
import { glob } from "tinyglobby";

const files = await glob([ "**/index.json", "**/use.ts" ], {
  cwd:import.meta.dirname,
});

export const routes: Array<{
  name: string;
  file: "index",
  params: Record<string, unknown>;
  use: Array<string>;
} | {
  name:string;
  file: "use",
}> = []

for (const file of files) {
  const name = dirname(file);
  if (file.endsWith("index.json")) {
    const pathTokens = pathTokensFactory(name);
    routes.push({
      name,
      file: "index",
      params: Object.fromEntries(
        pathTokens.flatMap((e) => {
          return e.kind === "param"
            ? e.parts.flatMap((e) => {
              return e.type === "param"
                ? [[e.name, e.kind === "splat" ? [e.const] : e.const]]
                : [];
            })
            : [];
        })
      ),
      use: await import(`${import.meta.dirname}/${file}`, {
        with: { type: "json" }
      }).then((e) => e.default),
    })
  }
  else {
    routes.push({
      name,
      file: "use",
    })
  }
}
