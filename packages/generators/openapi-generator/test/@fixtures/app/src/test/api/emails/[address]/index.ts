import { defineRoute } from "@test/index";

type EmailResponse = {
  email: string;
  verified: boolean;
  primary: boolean;
  userId: number;
};

type EmailQuery = {
  includeUser?: boolean;
  includeStats?: boolean;
};

export default defineRoute<[TRefine<string, { format: "email" }>]>(
  ({ GET }) => [
    GET<{ json: EmailQuery; response: [200, "json", EmailResponse] }>(
      async (ctx) => {
        ctx.body = {
          email: ctx.params.address,
          verified: true,
          primary: true,
          userId: 123,
        };
      },
    ),
  ],
);
