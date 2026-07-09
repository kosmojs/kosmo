export type DeviceInfo = {
  name: VRefine<string, { minLength: 1; maxLength: 50 }>;
  type: "mobile" | "tablet" | "desktop";
  os: string;
  browser?: string;
};
