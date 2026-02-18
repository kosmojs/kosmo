import { defineRoute } from "@test/index";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
    };
  };
  created: number;
};

type WebhookResponse = {
  received: boolean;
  processed: string;
  timestamp: string;
};

export default defineRoute(({ POST }) => [
  POST<
    {
      json: StripeEvent,
      response: [200, "json", WebhookResponse]
    },
    {
      response: {
        runtimeValidation: false
      }
    }
  >(async (ctx) => {
    const event = ctx.validated.json;
    switch (event.type) {
      case "payment_intent.succeeded":
        break;
      case "invoice.payment_failed":
        break;
    }
    ctx.body = {
      received: true,
      processed: event.type,
      timestamp: new Date().toISOString(),
    };
  }),
]);
