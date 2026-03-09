import { vi } from "vitest";

import { use } from "@src/templates/lib/api";

vi.mock("{{ createImport 'libApi' }}", () => ({
  use,
}));

vi.mock("{{ createImport 'api' 'use' }}", () => ({
  default: [],
}));

vi.mock("{{ createImport 'lib' '@api/routes' }}", () => ({
  routeSources: [],
}));
