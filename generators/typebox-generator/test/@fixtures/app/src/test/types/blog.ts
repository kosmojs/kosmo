export type BlogAuthor = {
  id: VRefine<string, { pattern: "^[a-zA-Z0-9_-]{1,50}$" }>;
  name: string;
  avatar?: string;
};
