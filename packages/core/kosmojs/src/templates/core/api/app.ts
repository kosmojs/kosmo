import { type AppOptions, createApp } from "@kosmojs/api";

export default (options?: AppOptions) => {
  const app = createApp(options);
  return app;
};
