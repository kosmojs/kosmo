import { defineRoute } from "@test/index";

type ApiInfo = {
  version: string;
  format: string;
  data: {
    message: string;
    endpoints: string[];
    documentation: string;
  };
};

type VersionQuery = {
  includeDeprecated?: boolean;
  includeExperimental?: boolean;
  fields?: string[];
};

export default defineRoute<["v1" | "v2" | "v3", "json" | "xml" | "yaml"]>(
  ({ GET }) => [
    GET<{
      json: VersionQuery,
      response: [200, "json", ApiInfo]
    }>(async (ctx) => {
      ctx.body = {
        version: ctx.params.version || "v1",
        format: ctx.params.format || "json",
        data: {
          message: "API response",
          endpoints: ["/users", "/posts", "/search"],
          documentation: "https://api.example.com/docs",
        },
      };
    }),
  ],
);
