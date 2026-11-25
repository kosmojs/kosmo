<script setup lang="ts">
import KosmoMark from "../components/KosmoMark.vue";
import Icon from "./Icon.vue";

const columns = [
  {
    title: "Start",
    links: [
      { text: "About", href: "/about" },
      { text: "Features", href: "/features" },
      { text: "Quick Start", href: "/start" },
      { text: "Tutorial", href: "/tutorial" },
    ],
  },
  {
    title: "Guides",
    links: [
      { text: "Routing", href: "/routing/intro" },
      { text: "Validation", href: "/validation/intro" },
      { text: "Fetch Clients", href: "/fetch/intro" },
      { text: "Sidecar Folders", href: "/sidecar/intro" },
    ],
  },
  {
    title: "Reference",
    links: [
      { text: "Configuration", href: "/essentials/config" },
      { text: "CLI", href: "/cli/intro" },
      { text: "OpenAPI", href: "/openapi/intro" },
      { text: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Project",
    links: [
      { text: "Blog", href: "/blog/" },
      { text: "llms.txt", href: "/llms.txt" },
      {
        text: "GitHub",
        href: "https://github.com/kosmojs/kosmo",
        external: true,
      },
    ],
  },
];
</script>

<template>
  <footer class="foot">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <a class="brand" href="/"><KosmoMark :size="28" /> KosmoJS</a>
          <p class="greek">
            Named after the Greek
            <span class="g">Kosmos (&#954;&#972;&#963;&#956;&#959;&#962;)</span>
            - order, world.
          </p>
          <a
            class="gh"
            href="https://github.com/kosmojs/kosmo"
            target="_blank"
            rel="noopener"
            aria-label="KosmoJS on GitHub"
          >
            <Icon name="github" />
          </a>
        </div>

        <nav v-for="col in columns" :key="col.title" class="foot-col" :aria-label="col.title">
          <span class="col-title">{{ col.title }}</span>
          <a
            v-for="link in col.links"
            :key="link.href"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener' : undefined"
          >
            {{ link.text }}
          </a>
        </nav>
      </div>

      <div class="foot-copy">
        <span>Released under the MIT License.</span>
        <span>&copy; 2025-present Slee Woo</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ---------- footer ---------- */

.foot {
  position: relative;
  margin-top: 40px;
  border-top: 1px solid var(--kx-line-soft);
  padding: 64px 0 36px;
  background-color: var(--kx-bg-sunk);
  font-size: 14px;
  color: var(--kx-text-4);
}

.foot-grid {
  display: grid;
  grid-template-columns: 1.6fr repeat(4, 1fr);
  gap: 40px 28px;
}

@media (max-width: 900px) {
  .foot-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .foot-brand {
    grid-column: 1 / -1;
  }
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--kx-font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: var(--kx-text);
}

.greek {
  max-width: 260px;
  margin: 16px 0 20px;
  line-height: 1.6;
  color: var(--kx-text-3);
}

.greek .g {
  color: var(--kx-text-2);
}

.gh {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--kx-line);
  border-radius: 10px;
  color: var(--kx-text-3);
  transition:
    color 0.15s,
    border-color 0.15s;
}

.gh :deep(svg) {
  width: 18px;
  height: 18px;
}

.gh:hover {
  border-color: var(--kx-accent-line);
  color: var(--kx-accent);
}

.foot-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.col-title {
  margin-bottom: 6px;
  font-family: var(--kx-font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.foot-col a {
  width: fit-content;
  color: var(--kx-text-3);
  transition: color 0.15s;
}

.foot-col a:hover {
  color: var(--kx-accent);
}

.foot-copy {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  margin-top: 56px;
  padding-top: 24px;
  background: linear-gradient(
      90deg,
      var(--kx-line-strong),
      var(--kx-accent-line) 50%,
      var(--kx-line-strong)
    )
    0 0 / 100% 1px no-repeat;
  font-family: var(--kx-font-mono);
  font-size: 12px;
}
</style>
