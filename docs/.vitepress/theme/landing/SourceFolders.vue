<script setup lang="ts">
import Icon from "./Icon.vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section slab" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap sol-grid">
      <div class="rise">
        <p class="eyebrow">built on Vite</p>
        <h2>Source folders.</h2>
        <p class="sol-lead">
          One folder per concern. A source folder is whatever you need it to be -
          a public site, an internal tool, a backend-only webhook handler, a docs site -
          each with its own backend and frontend framework, base URL, and build output.
          None of them are separate packages.
        </p>
        <p class="sol-lead">
          Or nothing served at all. A <b>sidecar</b> folder builds a standalone process -
          a queue consumer, a mail sender, a listener speaking another protocol -
          with the same types, the same imports, and its own build.
          Folders build together and run apart.
        </p>
      </div>

      <ul class="sol-points rise" style="--d: 1">
        <li>
          <span class="tick"><Icon name="check" /></span>
          <span>
            One <b>package.json</b>, one <b>node_modules</b>,
            one set of <b>types</b> shared across every folder.
          </span>
        </li>
        <li>
          <span class="tick"><Icon name="check" /></span>
          <span>
            Need a type from the customer app in the admin panel? <b>Import it.</b>
            Change a model and every folder sees it immediately.
          </span>
        </li>
        <li>
          <span class="tick"><Icon name="check" /></span>
          <span>
            One command starts them all. One builds them all.
            Or build the named folders only, your take.
          </span>
        </li>
        <li>
          <span class="tick"><Icon name="check" /></span>
          <span>
            No publishing, no versioning, no workspace protocols.
            The directory structure <b>enforces boundaries</b> code review can't.
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
/* ---------- source folders ---------- */

.sol-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 72px;
  align-items: center;
}

@media (max-width: 960px) {
  .sol-grid {
    grid-template-columns: 1fr;
    gap: 44px;
  }
}

.sol-lead {
  margin: 22px 0 0;
  font-size: 17.5px;
  color: var(--kx-text-3);
}

.sol-lead b {
  color: var(--kx-text);
}

/*
  The points sit on a lifted panel and are separated by fading hairlines,
  so they read as one checklist rather than four floating lines.
*/
.sol-points {
  border: 1px solid var(--kx-line);
  border-radius: var(--kx-radius);
  padding: 8px 28px;
  background-color: var(--kx-bg-lift);
  box-shadow: var(--kx-shadow-card);
}

.sol-points li {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px 0;
  font-size: 15.5px;
  line-height: 1.6;
}

.sol-points li + li {
  background: var(--kx-rule) 0 0 / 100% 1px no-repeat;
}

.tick {
  flex: none;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  border-radius: 50%;
  background-color: var(--kx-brand);
  color: var(--kx-brand-ink);
  box-shadow: 0 0 0 4px var(--kx-accent-soft);
}

.tick :deep(svg) {
  width: 14px;
  height: 14px;
  stroke-width: 2.4;
}

.sol-points b {
  color: var(--kx-text);
}
</style>
