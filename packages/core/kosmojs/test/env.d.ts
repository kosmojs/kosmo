import "vitest";

declare module "vitest" {
  export interface TestContext {
    tempDir: string;
  }
}
