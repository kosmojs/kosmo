import { defineRoute } from "@test/index";

export default defineRoute(({ POST }) => [
  POST<{
    response: [
      200,
      "json",
      {
        id: VRefine<string, { format: "uuid" }>;
        email: VRefine<string, { format: "email" }>;
        firstName: string;
        lastName: string;
        dateOfBirth: VRefine<string, { format: "date" }>;
        emailVerified: boolean;
        createdAt: Date; // Date instance (from ORM)
        updatedAt: Date; // Date instance (from ORM)
      },
    ];
  }>(async () => {}),
]);
