declare module "virtual:kosmo/backend-app" {
  import type { FetchApp, NodeApp } from "@kosmojs/core";
  const backend: FetchApp | NodeApp | undefined;
  export default backend;
}

declare module "{{ createImport 'libCore' }}" {
  import type { PageRouteSerialized } from "@kosmojs/core";
  import type { RoutePathMethods } from "@kosmojs/core/generators";
  export const name: string;
  export const pageRouteMap: Record<string, PageRouteSerialized & RoutePathMethods<[]>>;
}

declare module "{{ createImport 'lib' 'fetch' }}" {
  export type ResponseT = Record<string, Record<string, unknown>>;
  const fetchClients: Record<string, Record<string, Function>>;
  export default fetchClients;
}

declare module "{{ createImport 'lib' 'test/api' }}" {
  export * from "#/templates/lib/api";
}

declare module "{{ createImport 'lib' 'test/pages' }}" {
  export * from "#/templates/lib/pages";
}

declare module "{{ createImport 'src' 'kosmo.config' }}" {
  import type { SourceFolder } from "@kosmojs/core";
  const folderConfig: Pick<SourceFolder, "config" | "generators">;
  export default folderConfig;
}

declare module "@kosmojs/dev/chassis" {
  import type { ChassisCommand } from "@kosmojs/core";
  const chassis: (command: ChassisCommand, settings: ProjectSettings) => Promise<{
    restart: () => Promise<void>;
    teardown: () => Promise<void>;
  }>;
  export default chassis;
  export { findFreePortRange } from "@kosmojs/lib";
}
