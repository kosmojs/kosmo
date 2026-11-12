/** an entity, as every record has it */
export interface Entity {
  id: number;
  // when it was created
  createdAt: VRefine<string, { format: "date-time" }>;
}

export type Page<T> = { items: Array<T>; total: number };

export type Status = "active" | "inactive";

export enum Role {
  Admin = "admin",
  Member = "member",
}

// never reached from a route: an unsupported construct here must not matter
export type Unused = typeof globalThis;
