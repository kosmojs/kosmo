<script setup lang="ts">
import Icon from "./Icon.vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section slab" id="loop" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="section-head rise">
        <p class="eyebrow">connected apps, provisioned</p>
        <h2>Everything provided - <span class="dim">you just add features.</span></h2>
        <p>You no longer manage repos or wrestle configs - you write business logic.</p>
      </div>

      <!--
        The route and the page are the two ends of one wire, so they are
        drawn as a pair with a joint between them.
      -->
      <div class="loop-cols rise">
        <div class="vp-doc codecard">
          <span class="end">backend</span>
          <slot name="route" />
        </div>

        <span class="joint" aria-hidden="true"><Icon name="link" /></span>

        <div class="vp-doc codecard">
          <span class="end">frontend</span>
          <slot name="page" />
        </div>
      </div>

      <p class="loop-note rise">
        <span class="t-kw">[id]</span> required
        <span class="sep">/</span>
        <span class="t-kw">{id}</span> optional
        <span class="sep">/</span>
        <span class="t-kw">{...path}</span> splat
        <span class="tail">- identical syntax for API routes and pages.</span>
      </p>

      <ol class="loop-feats">
        <li class="lfeat rise" style="--d: 0">
          Directory-based routing wires routes identically across backend and frontend,
          using same params convention across all frameworks.
        </li>
        <li class="lfeat rise" style="--d: 1">
          Your types compile into high-performance runtime validation,
          with fetch clients and an OpenAPI spec derived from the same types.
        </li>
        <li class="lfeat rise" style="--d: 2">
          Cascading middleware removes the import-and-wire busywork.
          Middleware slots allow surgical overrides at any level depth.
        </li>
        <li class="lfeat rise" style="--d: 3">
          Nested layouts, route preload, server-side rendering, conventions
          and anything your chosen framework supports stay available.
        </li>
      </ol>

      <p class="loop-line rise">
        KosmoJS adds no proprietary abstractions to fight -
        <span class="text-nowrap">you keep direct,</span> full access to the frameworks underneath.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* ---------- core loop ---------- */

#loop {
  scroll-margin-top: var(--vp-nav-height);
}

.loop-cols {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .loop-cols {
    grid-template-columns: 1fr;
  }
}

.codecard {
  position: relative;
}

/* a mono tag riding on the top edge of each block */
.end {
  position: absolute;
  top: -10px;
  right: 16px;
  z-index: 2;
  border: 1px solid var(--kx-line);
  border-radius: 999px;
  padding: 1px 10px;
  background-color: var(--kx-bg-sunk);
  font-family: var(--kx-font-mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--kx-text-4);
}

.codecard :deep(.vp-code-group) {
  margin-top: 0;
}

.codecard :deep(div[class*="language-"]) {
  margin: 0;
}

.joint {
  position: absolute;
  top: 22px;
  left: 50%;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--kx-accent-line);
  border-radius: 50%;
  background-color: var(--kx-bg-sunk);
  color: var(--kx-accent);
  box-shadow:
    0 0 0 5px var(--kx-bg-sunk),
    0 0 24px var(--kx-brand-glow);
  transform: translateX(-50%);
}

.joint :deep(svg) {
  width: 16px;
  height: 16px;
}

@media (max-width: 900px) {
  .joint {
    display: none;
  }
}

.loop-note {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px 10px;
  width: fit-content;
  max-width: 100%;
  margin: 32px auto 0;
  border: 1px solid var(--kx-line);
  border-radius: 999px;
  padding: 9px 20px;
  background-color: var(--kx-bg-lift);
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  color: var(--kx-text-3);
}

.loop-note .t-kw {
  color: var(--kx-accent);
}

.loop-note .sep {
  color: var(--kx-line-strong);
}

.loop-note .tail {
  color: var(--kx-text-4);
}

@media (max-width: 560px) {
  .loop-note {
    border-radius: 14px;
    font-size: 12px;
  }
}

/* four numbered mechanisms, each opening on the section rule */
.loop-feats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  margin: 72px 0 56px;
  padding: 0;
  list-style: none;
  counter-reset: lfeat;
}

@media (max-width: 1000px) {
  .loop-feats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .loop-feats {
    grid-template-columns: 1fr;
    gap: 26px;
  }
}

.lfeat {
  position: relative;
  padding-top: 52px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--kx-text-2);
  counter-increment: lfeat;
}

.lfeat::before {
  content: counter(lfeat, decimal-leading-zero);
  position: absolute;
  top: 18px;
  left: 0;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-accent);
}

.lfeat::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--kx-rule);
}

.loop-line {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
  font-family: var(--kx-font-display);
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: var(--kx-text);
  text-wrap: balance;
}
</style>
