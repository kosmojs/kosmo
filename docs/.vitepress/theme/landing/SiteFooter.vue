<script setup lang="ts">
import KosmoMark from "../components/KosmoMark.vue";
</script>

<template>
  <footer class="foot">
    <div class="wrap foot-inner">
      <a class="brand" href="/"><KosmoMark :size="26" /> KosmoJS</a>
      <nav class="foot-links">
        <a href="/about">About</a>
        <a href="/features">Features</a>
        <a href="/routing/intro">Routing</a>
        <a href="/validation/intro">Validation</a>
        <a href="https://github.com/kosmojs/kosmo" target="_blank" rel="noopener">GitHub</a>
      </nav>
      <div class="foot-copy">
        Named after the Greek <span class="mono greek">Kosmos (κόσμος)</span> - order, world.
        &nbsp;·&nbsp; Released under the MIT License. &nbsp;·&nbsp; © 2025-present Slee Woo
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ---------- footer ---------- */

/*
  The brand lockup used to be shared with the landing's own header. The header
  is the default theme's now, so this is the only place left that needs it.
*/
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  font-family: var(--kx-font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: var(--kx-text);
}

.foot {
  border-top: 1px solid var(--kx-line-soft);
  background: var(--kx-bg-sunk);
  padding: 40px 0;
  color: var(--kx-text-4);
  font-size: 14px;
}

.foot-inner {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.foot-inner .brand {
  margin-right: auto;
  font-size: 16px;
}

.foot-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.foot-links a {
  font-family: var(--kx-font-mono);
  font-size: 13px;
  color: var(--kx-text-3);
  transition: color 0.15s;
}

.foot-links a:hover {
  color: var(--kx-text);
}

.foot-copy {
  width: 100%;
  margin-top: 24px;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--kx-text-4);
}

.foot-copy .greek {
  color: var(--kx-text-3);
}
</style>
