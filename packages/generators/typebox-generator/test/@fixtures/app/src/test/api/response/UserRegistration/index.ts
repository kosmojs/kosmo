import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        id: TRefine<string, { format: "uuid" }>;
        email: TRefine<string, { format: "email" }>;
        firstName: string;
        lastName: string;
        dateOfBirth: TRefine<string, { format: "date" }>;
        emailVerified: boolean;
        createdAt: Date; // Date instance (from ORM)
        updatedAt: Date; // Date instance (from ORM)
      },
    ];
  }>(async () => {}),
]);
