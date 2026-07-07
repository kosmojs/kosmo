import Type from "typebox";
import { Settings } from "typebox/system";

Settings.Set({ exactOptionalPropertyTypes: true });

const customType = <T>(
  check: (value: unknown) => value is T,
  message: string,
) => Type.Refine(Type.Unsafe<T>({}), check, () => message);

export const TDate = () => {
  return customType(
    (value): value is Date => value instanceof Date,
    "must be Date",
  );
};

export default {
  Date: TDate(),
};
