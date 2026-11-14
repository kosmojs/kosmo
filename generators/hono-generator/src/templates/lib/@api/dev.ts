import type {
  DevAppFactory,
  DevSetup,
  DevSetupOptions,
} from "@kosmojs/core/api";

export const devSetup = (
  factory: DevAppFactory,
  options?: DevSetupOptions,
): DevSetup => {
  return { ...options, factory };
};
