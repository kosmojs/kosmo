import { defineRoute } from "@test/index";

type UserResponse = {
  id: number;
  name: TRefine<string, { minLength: 1; maxLength: 100 }>;
  email: TRefine<string, { format: "email" }>;
  role: "admin" | "user" | "moderator";
  createdAt: TRefine<string, { format: "date-time" }>;
};

type UpdateUserPayload = {
  name?: TRefine<string, { minLength: 1; maxLength: 100 }>;
  email?: TRefine<string, { format: "email" }>;
  role?: "admin" | "user" | "moderator";
};

type UserQuery = {
  include?: "profile" | "posts" | "all";
  fields?: string[];
  expand?: boolean;
};

export default defineRoute<[TRefine<number, { minimum: 1 }>]>(
  ({ GET, PUT, DELETE }) => [
    GET<{
      json: UserQuery,
      response: [200, "json", UserResponse]
    }>(async (ctx) => {
      ctx.body = {
        id: Number(ctx.params.id),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        createdAt: "2024-01-01T00:00:00Z",
      };
    }),

    PUT<{
      json: UpdateUserPayload,
      response: [200, "json", UserResponse]
    }>(async (ctx) => {
      const updates = ctx.validated.json
      ctx.body = {
        id: Number(ctx.params.id),
        name: updates.name || "John Doe",
        email: updates.email || "john@example.com",
        role: updates.role || "user",
        createdAt: "2024-01-01T00:00:00Z",
      };
    }),

    DELETE<{
      response: [200, "json", { success: boolean; message: string }]
    }>(async (ctx) => {
      ctx.body = { success: true, message: "User deleted" };
    }),
  ],
);
