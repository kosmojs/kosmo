import type { Page, User } from "@/types/discovery";

export default defineRoute<"discovery">(({ POST }) => [
  POST<{
    json: { users: Page<User> };
    response: [200, "json", { total: number }];
  }>(async () => {}),
]);
