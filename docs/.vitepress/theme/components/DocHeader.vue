<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { useLayout } from "vitepress/theme";
import { computed } from "vue";

type Item = { text?: string; link?: string; items?: Item[] };

const { frontmatter, lang } = useData();
const route = useRoute();
const { sidebar } = useLayout();

// "/routing/intro.html", "/routing/intro" and "/blog/" all compare equal
const norm = (path = "") => {
  return path
    .replace(/[?#].*$/, "")
    .replace(/\.html$/, "")
    .replace(/\/index$/, "/")
    .replace(/\/$/, "");
};

/*
  The trail is read off the sidebar rather than the URL, so it uses the
  same words the navigation does: the group the page sits in, then the
  page's own entry. A page the sidebar does not list gets no trail.
*/
const trail = computed(() => {
  const here = norm(route.path);
  const walk = (items: Item[], parents: string[]): string[] | undefined => {
    for (const item of items) {
      if (item.link && norm(item.link) === here) {
        return [...parents, item.text ?? ""];
      }
      if (item.items) {
        const found = walk(item.items, [...parents, item.text ?? ""]);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  const found = walk(sidebar.value as Item[], []);

  if (!found) {
    return [];
  }

  const crumbs = found.filter(Boolean);

  if (here.startsWith("/blog") && crumbs[0] !== "Blog") {
    crumbs.unshift("Blog");
  }

  return crumbs;
});

// the markdown's own h1 wins; config.ts records whether there is one
const showTitle = computed(() => {
  return Boolean(frontmatter.value.title) && !frontmatter.value.kxHasH1;
});

const date = computed(() => {
  const raw = frontmatter.value.date;

  if (!raw) {
    return undefined;
  }

  const d = new Date(raw);

  if (Number.isNaN(d.getTime())) {
    return undefined;
  }

  return {
    iso: d.toISOString(),
    text: d.toLocaleDateString(lang.value || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }),
  };
});

const minutes = computed(() => Number(frontmatter.value.kxMinutes) || 0);

const visible = computed(() => {
  return trail.value.length > 0 || showTitle.value || Boolean(date.value);
});
</script>

<template>
  <header v-if="visible" class="kx-doc-header" :class="{ 'no-title': !showTitle }">
    <nav v-if="trail.length" class="crumbs" aria-label="Breadcrumb">
      <template v-for="(crumb, i) in trail" :key="i">
        <span class="slash" aria-hidden="true">/</span>
        <span :class="{ here: i === trail.length - 1 }">{{ crumb }}</span>
      </template>
    </nav>

    <h1 v-if="showTitle" class="title">{{ frontmatter.title }}</h1>

    <div v-if="date || (minutes && showTitle)" class="meta">
      <time v-if="date" :datetime="date.iso">{{ date.text }}</time>
      <span v-if="minutes">{{ minutes }} min read</span>
    </div>
  </header>
</template>

<style scoped>
.kx-doc-header {
  margin-bottom: 34px;
}

.kx-doc-header.no-title {
  margin-bottom: 12px;
}

.kx-doc-header.no-title .meta {
  margin-top: 0;
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  margin-bottom: 16px;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  color: var(--kx-text-4);
}

.crumbs .slash {
  color: var(--kx-accent);
  opacity: 0.75;
}

.crumbs .here {
  color: var(--kx-text-2);
}

.title {
  margin: 0;
  font-family: var(--kx-font-display);
  font-size: clamp(32px, 4.6vw, 46px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: var(--kx-text);
  text-wrap: balance;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 18px;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-4);
}

.meta > * {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.meta > *::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--kx-accent);
  opacity: 0.8;
}
</style>
