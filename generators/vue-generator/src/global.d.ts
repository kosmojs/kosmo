export declare global {
  interface Window {
    __KOSMO_HYDRATION_DATA__: Record<string, unknown> | undefined;
    // set by the SSR server on server-rendered pages
    __KOSMO_HYDRATION_BOOL__?: {};
  }
}
