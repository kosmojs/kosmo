type CSRSetup = {
  hydrate: () => Promise<unknown>;
  mount: () => Promise<unknown>;
};

export type CSRFactory = (factory: () => CSRSetup) => void;
