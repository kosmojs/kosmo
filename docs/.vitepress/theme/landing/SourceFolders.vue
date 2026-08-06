<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <!-- SOLUTION: source folders -->
  <section class="section" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="rise sol-block">
        <p class="eyebrow">built on Vite</p>
        <h2 class="h2-md">Source folders.</h2>
        <p class="sol-lead">
          One folder per concern. A source folder is whatever you need it to be -
          a public site, an internal tool, a backend-only webhook handler, a docs site -
          each with its own backend and frontend framework, base URL, and build output.
          None of them are separate packages.
        </p>
        <ul class="sol-points">
          <li><span class="ok">OK</span><span>One <b>package.json</b>, one <b>node_modules</b>, one set of <b>types</b> shared across every folder.</span></li>
          <li><span class="ok">OK</span><span>Need a type from the customer app in the admin panel? <b>Import it.</b> Change a model and every folder sees it immediately.</span></li>
          <li><span class="ok">OK</span><span>One command starts them all. One builds them all. Or build a <b>single folder</b> when that is all you need.</span></li>
          <li><span class="ok">OK</span><span>No publishing, no versioning, no workspace protocols. The directory structure <b>enforces boundaries</b> code review can't.</span></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- source folders ---------- */

.sol-block {
  max-width: 760px;
}

.h2-md {
  font-size: clamp(28px, 4vw, 42px);
}

.sol-lead {
  margin: 16px 0 0;
  font-size: 17.5px;
  color: var(--kx-text-3);
}

.sol-points {
  display: grid;
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 28px 0 0;
}

.sol-points li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  font-size: 15.5px;
  color: var(--kx-text-2);
}

.sol-points li .ok {
  flex: none;
  margin-top: 3px;
  padding: 1px 6px;
  border: 1px solid color-mix(in srgb, var(--kx-accent-2) 40%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--kx-accent-2) 10%, transparent);
  font-family: var(--kx-font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--kx-accent-2);
}

.sol-points li b {
  color: var(--kx-text);
  font-weight: 600;
}
</style>
