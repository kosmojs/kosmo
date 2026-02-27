```ts [api/users/index.ts]
import { defineRoute } from "_/admin/api/users";

export default defineRoute(({ POST }) => [
  POST<{
    json: {
      email: TRefine<string, { format: "email" }>;
      password: TRefine<string, { pattern: "^(?=.*[a-zA-Z0-9])$" }>;
      name: TRefine<string, { minLength: 5; maxLength: 50 }>;
      dateOfBirth: TRefine<string, { format: "date" }>;
      agreeToTerms: boolean;
      marketingOptIn?: boolean;
    }
  }>((ctx) => {
    // ctx.validated.json is typed and validated at runtime // [!code hl]
  })
]);
```
