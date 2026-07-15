type CSRSetup = {
  mount: () => void | Promise<void>;
  hydrate: () => void | Promise<void>;
};

export type CSRFactory = (factory: () => CSRSetup) => void;
