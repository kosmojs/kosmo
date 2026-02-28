import { defineRoute } from "@test/index";

type LoginPayload = {
  email: TRefine<string, { format: "email" }>;
  password: TRefine<string, { minLength: 8 }>;
  rememberMe?: boolean;
};

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  expiresIn: number;
};

export default defineRoute(({ POST }) => [
  POST<{
    form: LoginPayload;
    response: [200, "json", LoginResponse],
  }>(
    async (ctx) => {
      const { email, rememberMe } = ctx.validated.form;
      ctx.body = {
        token: "jwt-token-here",
        user: {
          id: 1,
          name: "John Doe",
          email,
          role: "user",
        },
        expiresIn: rememberMe ? 2592000 : 86400,
      };
    },
  ),
]);
