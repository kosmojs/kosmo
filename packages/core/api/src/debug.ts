import { styleText } from "node:util";

import stringWidth from "string-width";

import type { HTTPMethod, RouterRoute, UseOptions } from "./types";

const colorizeMethod = (method: string): string => {
  const color = (
    {
      HEAD: "gray",
      GET: "green",
      POST: "blue",
      PATCH: "blue",
      PUT: "blue",
      DELETE: "red",
    } as const
  )[method];
  return color ? styleText(color, method) : method;
};

export const debugRouteEntry = <MiddlewareT>(entry: {
  name: string;
  path: string;
  file: string;
  methods: Array<string>;
  middleware: Array<{
    middleware: Array<MiddlewareT>;
    options?: UseOptions | undefined;
  }>;
  handler: {
    kind: "handler";
    middleware: Array<MiddlewareT>;
    method: HTTPMethod;
  };
}): RouterRoute<MiddlewareT>["debug"] => {
  const { path, file } = entry;

  const methodLines = entry.methods.flatMap((method) => {
    const coloredMethod = colorizeMethod(method);
    return method === "GET"
      ? [coloredMethod + styleText("gray", "|HEAD")]
      : [coloredMethod];
  });

  const middlewareLines = entry.middleware
    .map(({ options, middleware }) => {
      const lines: Array<string> = [];

      if (options?.slot) {
        lines.push(
          `${styleText("dim", "slot:")} ${styleText("blue", options.slot)};`,
        );
      }

      const funcNames = middleware.map((fn) => {
        return styleText("magenta", funcName(fn as Function));
      });

      lines.push(`${styleText("dim", "exec:")} ${funcNames.join("; ")}`);

      return lines.join(" ");
    })
    .join(`\n${Array(12).fill(" ").join("")}`);

  const handlerLines = entry.handler.middleware.map((fn) => {
    return styleText("yellow", funcName(fn as Function));
  });

  const headline = `${styleText("bgBlue", styleText("black", ` ${path} `))} ${styleText("gray", `[ ${file} ]`)}`;
  const methods = `${styleText("dim", "   methods:")} ${methodLines.join(" ")}`;
  const middleware = `${styleText("dim", "middleware:")} ${middlewareLines}`;
  const handler = `${styleText("dim", "   handler:")} ${handlerLines.join(Array(7).fill(" ").join(""))}`;

  const maxColumns = process.stdout.isTTY
    ? Number(process.stdout.columns || 80)
    : 80;

  const debugEntries = [
    ["headline", headline],
    ["methods", methods],
    ["middleware", middleware],
    ["handler", handler],
  ] as const;

  const lineMapper = (line: string) => {
    const freeColumns = maxColumns - stringWidth(line);
    return freeColumns > 0
      ? [
          line,
          styleText(
            "dim",
            styleText("gray", Array(freeColumns).fill("·").join("")),
          ),
        ].join("")
      : line;
  };

  const debug = debugEntries.reduce(
    (map, [key, line]) => {
      map[key] = line.split("\n").map(lineMapper).join("\n");
      return map;
    },
    {} as RouterRoute<MiddlewareT>["debug"],
  );

  return {
    ...debug,
    full: Object.values(debug).join("\n"),
  };
};

const funcName = (fn: Function) => {
  return fn.name || fn.toString().split("\n")[0].slice(0, 30);
};
