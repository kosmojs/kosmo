<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
      <section class="section" id="loop" ref="rootEl" :class="{ 'is-ready': ready }">
        <div class="wrap">
          <div class="section-head rise">
            <p class="eyebrow">connected apps, provisioned</p>
            <h2>Structure and toolchain provided - you just add features.</h2>
          </div>

          <p class="loop-line loop-intro rise">You no longer manage repos or wrestle configs - you write business logic.</p>

          <div class="loop-cols rise">
            <!-- backend: the route -->
            <div class="vp-doc codecard">
              <slot name="route" />
            </div>

            <!-- frontend: the page -->
            <div class="vp-doc codecard">
              <slot name="page" />
            </div>
          </div>
          <p class="loop-note"><span class="t-kw">[id]</span> required <span class="sep">·</span> <span class="t-kw">{id}</span> optional <span class="sep">·</span> <span class="t-kw">{...path}</span> splat - identical syntax for API routes and pages.</p>

          <div class="loop-feats rise">
            <div class="lfeat">
              Directory-based routing wires routes identically across backend and frontend,
              using same params convention across all frameworks.
            </div>
            <div class="lfeat">
              Your types compile into high-performance runtime validation, with fetch clients and an OpenAPI spec generated from the same types.
            </div>
            <div class="lfeat">
              Cascading middleware removes the import-and-wire busywork. Middleware slots allow surgical overrides at any level depth.
            </div>
            <div class="lfeat">
              Nested layouts, route preload, server-side rendering, conventions and anything your chosen framework supports stay available.
            </div>
          </div>

          <p class="loop-line rise">KosmoJS adds no proprietary abstractions to fight - you keep direct, full access to the frameworks underneath.</p>
        </div>
      </section>
</template>

<style scoped>
/* ---------- core loop ---------- */

.loop-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 860px) {
  .loop-cols {
    grid-template-columns: 1fr;
  }
}

.loop-note {
  margin: 26px 0 0;
  text-align: center;
  font-family: var(--kx-font-mono);
  font-size: 13px;
  color: var(--kx-text-4);
}

.loop-note .t-kw {
  color: var(--kx-accent);
}

.loop-note .sep {
  margin: 0 5px;
  color: var(--kx-line-strong);
}

@media (max-width: 560px) {
  .loop-note {
    font-size: 12px;
  }
}

/* full-width intro / closing lines (no max-width, no forced break) */
#loop .section-head {
  margin-bottom: 28px;
}

.loop-line {
  margin: 0;
  font-size: 18px;
  line-height: 1.55;
  color: var(--kx-text-2);
}

.loop-intro {
  margin-bottom: 30px;
}

/* 2x2 mechanism grid - pcard manner, no header, regular size */
.loop-feats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px 44px;
  margin: 36px 0 40px;
}

@media (max-width: 820px) {
  .loop-feats {
    grid-template-columns: 1fr;
    gap: 22px;
  }
}

.lfeat {
  padding: 18px 0 0;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--kx-text-2);
  background-image: linear-gradient(
    90deg,
    var(--kx-accent-line),
    var(--kx-line) 34%,
    transparent 82%
  );
  background-repeat: no-repeat;
  background-size: 100% 1px;
  background-position: 0 0;
}
</style>
