import type { Entity, Role, Status as S } from "./base";

export interface User extends Entity {
  name: VRefine<string, { minLength: 1 }>;
  status: S;
  role: Role;
  admin?: Role.Admin;
}
