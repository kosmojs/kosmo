import { vi } from "vitest";

vi.mock("{{ createImport 'libCore' }}", () => ({
  apiRouteMap: {
    "": { params: [], numericProperties: { params: [] } },
    "{...path}": { params: ["path"], numericProperties: { params: [] } },
    "{...ids}": { params: ["ids"], numericProperties: { params: ["ids"] } },
    "[id]/[name]": {
      params: ["id", "name"],
      numericProperties: { params: ["id"] },
    },
  },
}));

vi.mock("{{ createImport 'api' 'use' }}", () => ({
  default: [],
}));
