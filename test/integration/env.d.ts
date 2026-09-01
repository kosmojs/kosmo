export declare global {
  interface Window {
    __APP_RENDERED__?: boolean;
  }
}

export declare module "vitest" {
  export interface ProvidedContext {
    MODE: "backend" | "csr" | "ssr" | "ssg" | undefined;
  }
}
