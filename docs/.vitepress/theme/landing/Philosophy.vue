<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section alt diff" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap rise">
      <p class="eyebrow">how it differs</p>
      <h2>Opinionated about structure.<br />Open about everything else.</h2>
      <p>
        Most meta-frameworks pick your frontend for you and own your deploy model. Monorepo tools hand
        you flexibility and a configuration tax. Microservices give independence and a fragmented codebase.
        <p>
          KosmoJS keeps the part that is <b>tedious to set up and easy to let erode</b> - routing conventions,
          the validation pipeline, middleware composition, build orchestration - and leaves the rest to you:
          <b>frontend, state, styling, database, deploy target.</b>
        </p>
      </p>
      <p class="tagline">Structure that scales. <span class="dim">Choices that stay yours.</span></p>
    </div>
  </section>
</template>

<style scoped>
/* ---------- differ / philosophy ---------- */

.diff h2 {
  font-size: clamp(28px, 4.2vw, 44px);
}

.diff p:not(.eyebrow) {
  margin: 22px 0 0;
  font-size: 17.5px;
  color: var(--kx-text-2);
}

.diff p b {
  color: var(--kx-text);
}

.tagline {
  margin-top: 40px;
  font-family: var(--kx-font-mono);
  font-size: clamp(18px, 2.4vw, 24px);
  letter-spacing: -0.01em;
  color: var(--kx-text);
}

.tagline .dim {
  color: var(--kx-text-4);
}
</style>
