import { describe, test } from "vitest";

import { prepareHarness } from "{{ createImport 'lib' 'test/pages' }}";

const { page, pages, route } = await prepareHarness("{{route.name}}");

describe(route, () => {
  test.todo(route);
});
