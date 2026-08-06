// Ambient type for Vite `?raw` imports of .hbs templates (raw string contents).
declare module "*.hbs?raw" {
  const content: string;
  export default content;
}
