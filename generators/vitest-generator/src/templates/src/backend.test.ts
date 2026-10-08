import { describe, test } from "vitest";

import { prepareHarness } from "{{ createImport 'lib' 'test/api' }}";

const { client, clients, route } = await prepareHarness("{{route.name}}");

describe(route, () => {
  test.todo(route);
});
