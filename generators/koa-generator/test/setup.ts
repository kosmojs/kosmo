import { vi } from "vitest";

vi.mock("{{ createImport 'api' 'use' }}", () => ({
  default: [],
}));
