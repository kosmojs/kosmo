import { defineRoute } from "@test/index";

export default defineRoute(({ GET, POST }) => [
  GET<{
    query: {
      page?: string;
      rating?: "1" | "2" | "3" | "4" | "5";
    };
  }>(async (ctx) => {}),

  POST<{
    json: {
      rating: number;
      title: string;
      body: string;
    };
    headers: {
      authorization: string;
    };
  }>(async (ctx) => {}),
]);
