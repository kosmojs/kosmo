<script setup lang="ts">
import { ref } from "vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();

const copyLabel = ref("copy");

function copyCmd() {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText("pnpm create kosmo").then(() => {
      copyLabel.value = "copied";
      setTimeout(() => (copyLabel.value = "copy"), 1400);
    });
  }
}
</script>

<template>
  <section class="section cta-final" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap rise">
      <h2>Zero to a working route in couple minutes</h2>
      <p>Scaffold a project, add a source folder, pick your stack.<br />The dev server does the rest.</p>
      <div class="install">
        <span><span class="prompt">$</span> <span class="cmd">pnpm create kosmo</span></span>
        <button :class="{ copied: copyLabel === 'copied' }" @click="copyCmd" aria-label="Copy command">{{ copyLabel }}</button>
      </div>
      <div class="cta-row">
        <a class="btn btn-primary" href="/start">Read the quick start <span class="arr">➜</span></a>
        <a class="btn btn-ghost" href="https://github.com/kosmojs/kosmo" target="_blank" rel="noopener">Star on GitHub ↗</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- final cta ---------- */

.cta-final {
  text-align: center;
}

.cta-final h2 {
  font-size: clamp(30px, 4.6vw, 46px);
}

.cta-final p {
  max-width: 520px;
  margin: 16px auto 34px;
  font-size: 17.5px;
  color: var(--kx-text-3);
}

.install {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 13px 16px;
  background: var(--vp-code-block-bg);
  box-shadow: var(--kx-shadow-card);
  font-family: var(--kx-font-mono);
  font-size: 14.5px;
}

.install .prompt {
  color: var(--kx-green);
}

.install .cmd {
  color: var(--vp-code-block-color);
}

.install button {
  min-width: 80px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  padding: 5px 11px;
  background: var(--vp-code-tab-bg);
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--vp-code-tab-text-color);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.install button:hover {
  color: var(--vp-code-block-color);
  border-color: var(--kx-accent-line);
}

.install button.copied {
  color: var(--kx-green);
}

.cta-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
