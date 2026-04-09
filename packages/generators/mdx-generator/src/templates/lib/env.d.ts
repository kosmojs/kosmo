declare module "*.mdx" {
  import type { ComponentType } from "preact";
  export const frontmatter: Record<string, unknown>;
  const component: ComponentType;
  export default component;
}

declare module "*.md" {
  import type { ComponentType } from "preact";
  export const frontmatter: Record<string, unknown>;
  const component: ComponentType;
  export default component;
}
