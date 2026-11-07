type Base = { id: number };

type Named = { name: string } | { title: string };

type Address = { street: string; city: string };

export type ClosedJson = {
  plain: { a: string };
  nested?: { inner: { x: number } };
  list?: Array<{ id: number }>;
  tuple?: [{ a: string }, number];
  merged?: Base & Named & VRefine<{ tag?: string }, { minProperties: 0 }>;
  partial?: Partial<Address>;
  omitted?: Omit<Address & { zip: string }, "zip">;
  meta?: Record<string, { v: string }>;
  reopened?: VRefine<{ a: string }, { additionalProperties: true }>;
  reopenedMember?: Base & VRefine<{ b?: string }, { additionalProperties: true }>;
  maybe?: { c: boolean } | null;
};

export type ClosedIntersection = Base & { extra: string };

export type ClosedForm = { title: string; tags?: Array<string> };

export type OpenQuery = { page?: number; filter?: { q: string } };

export type ClosedResponse = { id: number; profile: { name: string } };
