import { createContentLoader } from "vitepress";

export interface Post {
  title: string;
  url: string;
  description?: string;
  date: { time: number; string: string; iso: string };
}

declare const data: Post[];

export { data };

const wordsPerMinute = 200;

export default createContentLoader("blog/*/*.md", {
  excerpt: true,
  render: true,
  transform(raw) {
    return raw
      .map(({ url, frontmatter, excerpt, html }) => ({
        title: frontmatter.title,
        url,
        description: frontmatter.description ?? excerpt,
        date: formatDate(frontmatter.date || new Date()),
        readingTime: html ? readingTime(html) : undefined,
      }))
      .sort((a, b) => b.date.time - a.date.time);
  },
});

function formatDate(raw: string): Post["date"] {
  const date = new Date(raw);
  date.setUTCHours(12);
  return {
    time: +date,
    string: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    iso: date.toISOString().slice(0, 10),
  };
}

const readingTime = (html: string) => {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
};
