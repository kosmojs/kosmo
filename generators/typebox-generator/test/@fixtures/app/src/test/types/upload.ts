export type FileMetadata = {
  dimensions?: {
    width: VRefine<number, { minimum: 1 }>;
    height: VRefine<number, { minimum: 1 }>;
  };
  duration?: VRefine<number, { minimum: 0 }>;
  checksum: VRefine<string, { pattern: "^[a-f0-9]{32,64}$" }>;
};
