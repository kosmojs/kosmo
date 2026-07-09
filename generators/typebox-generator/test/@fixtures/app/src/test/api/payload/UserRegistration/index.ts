import { defineRoute } from "@test/index";
import type { UserRegistrationInput } from "@/types/registration";

export default defineRoute(({ POST }) => [
  POST<{
    json: UserRegistrationInput;
  }>(async () => {}),
]);
