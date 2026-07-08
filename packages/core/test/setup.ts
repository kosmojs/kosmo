import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./mocks";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
