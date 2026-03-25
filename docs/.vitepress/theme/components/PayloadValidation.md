```ts [api/users/index.ts]
import { defineRoute } from "_/admin/api";

type Payload = {
  email: VRefine<string, { format: "email" }>;
  password: VRefine<string, { pattern: "^(?=.*[a-zA-Z0-9])$" }>;
  name: VRefine<string, { minLength: 5; maxLength: 50 }>;
  dateOfBirth: VRefine<string, { format: "date" }>;
  agreeToTerms: boolean;
  marketingOptIn?: boolean;
}

export default defineRoute<"users">(({ POST }) => [
  POST<{
    json: Payload, // [!code hl]
  }>((ctx) => {
    // ctx.validated.json is typed and validated at runtime // [!code hl]
    const { email } = ctx.validated.json;
  })
]);
```
