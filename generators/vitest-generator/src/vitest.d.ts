export declare module "vitest" {
  interface ProvidedContext {
    [key: `KOSMO_TEST_URL:${string}:${"backend" | "frontend"}`]: string;
  }
}
