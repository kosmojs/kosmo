export type SidecarService = {
  // start the service; should return a close function
  start: () => Promise<() => Promise<void>>;
  // close outbound connections, if any (database, sockets, etc.)
  teardown?: () => Promise<void>;
};
