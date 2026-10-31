export type DisposableServerHandles = {
  restart: () => Promise<void>;
  teardown: () => Promise<void>;
};
