import type { ResolvedType } from "tfusion";

export type ResolvedTypeSignature = Omit<ResolvedType, "properties"> & {
  typeboxSchema?: string;
  properties?: Array<
    NonNullable<ResolvedType["properties"]>[number] & {
      typeboxSchema?: string;
    }
  >;
};
