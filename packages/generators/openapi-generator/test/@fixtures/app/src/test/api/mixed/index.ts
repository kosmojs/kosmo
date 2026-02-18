import { defineRoute } from "@test/index";

type StrictPayload = {
  id: number;
  name: string;
  email: TRefine<string, { format: "email" }>;
};

type LoosePayload = {
  data: {
    key: string;
    value: string;
  };
};

type StrictResponse = {
  success: boolean;
  data: {
    id: number;
    processed: boolean;
  };
};

type LooseResponse = {
  received: boolean;
  custom: string;
  metadata: {
    timestamp: string;
  };
};

type MixedQuery = {
  debug?: boolean;
  includeMetadata?: boolean;
  format?: "full" | "minimal";
};

export default defineRoute(({ GET, POST, PUT }) => [
  GET<{ json: MixedQuery; response: [200, "json", StrictResponse] }>(
    async (ctx) => {
      ctx.body = { success: true, data: { id: 1, processed: true } };
    },
  ),

  POST<
    { json: StrictPayload; response: [200, "json", LooseResponse] },
    {
      response: {
        runtimeValidation: false;
      };
    }
  >(async (ctx) => {
    ctx.body = {
      received: true,
      custom: "response",
      metadata: { timestamp: new Date().toISOString() },
    };
  }),

  PUT<
    {
      json: LoosePayload;
      response: [200, "json", StrictResponse];
    },
    {
      json: {
        runtimeValidation: false;
      };
    }
  >(async (ctx) => {
    ctx.body = { success: true, data: { id: 1, processed: true } };
  }),
]);
