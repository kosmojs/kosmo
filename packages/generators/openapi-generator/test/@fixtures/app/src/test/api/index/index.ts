import { defineRoute } from "@test/index";

type ApiInfo = {
  name: string;
  version: string;
  endpoints: string[];
  documentation: string;
};

type ApiQuery = {
  format?: "full" | "minimal";
  includeEndpoints?: boolean;
};

export default defineRoute<[]>(({ GET }) => [
  GET<{ json: ApiQuery; response: [200, "json", ApiInfo] }>(async (ctx) => {
    const { includeEndpoints } = ctx.validated.json;
    ctx.body = {
      name: "Test API",
      version: "1.0.0",
      endpoints: includeEndpoints
        ? ["/users", "/posts", "/search", "/analytics"]
        : [],
      documentation: "https://api.example.com/docs",
    };
  }),
]);
