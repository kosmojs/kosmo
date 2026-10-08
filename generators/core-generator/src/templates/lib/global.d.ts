export declare global {
  interface Window {
    __KOSMO_HYDRATION_BOOL__: boolean;
    __KOSMO_HYDRATION_DATA__: Record<string, unknown> | undefined;
  }
}

declare module "vitest" {
  interface ProvidedContext {
    [key: `KOSMO_TEST_URL:${string}:${"backend" | "frontend"}`]: string;
  }
}
