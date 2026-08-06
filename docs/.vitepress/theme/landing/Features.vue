<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section alt" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="section-head rise">
        <p class="eyebrow">what you get</p>
        <h2>Structure where it pays off.</h2>
        <p>With all features enabled out of the box, you forget about the tedious parts of a full-stack project. Multiple sub-projects merge into one coherent, scalable structure - which you don't have to maintain.</p>
      </div>
      <div class="feat-grid rise">
        <div class="fcard">
          <div class="ico">[ ]/</div>
          <h3>Directory-based routing</h3>
          <p>Your folder tree is the route map, for API and pages alike. Nothing to keep in sync.</p>
        </div>
        <div class="fcard">
          <div class="ico">&lt;T&gt;</div>
          <h3>End-to-end type safety</h3>
          <p>Write the type once. Runtime validation, a typed client, and OpenAPI all derive from it.</p>
        </div>
        <div class="fcard">
          <div class="ico">↯</div>
          <h3>Generated fetch clients</h3>
          <p>Every route gets a typed client. Invalid requests fail in the browser, before a round trip.</p>
        </div>
        <div class="fcard">
          <div class="ico">{ }</div>
          <h3>OpenAPI 3.1, free</h3>
          <p>A spec falls out of the same definitions - no annotation layer, no hand-authored schema.</p>
        </div>
        <div class="fcard">
          <div class="ico">⤵</div>
          <h3>Cascading middleware</h3>
          <p>Drop a <span class="mono">use.ts</span> in any folder; it wraps everything beneath it. No imports, no wiring.</p>
        </div>
        <div class="fcard">
          <div class="ico">⧉</div>
          <h3>Composable slots</h3>
          <p>Override one piece of global middleware per route or subtree. Inherit everything else.</p>
        </div>
        <div class="fcard">
          <div class="ico">⋓</div>
          <h3>Nested layouts</h3>
          <p>Compose shared shells - nav, sidebars, auth - at any depth. The file system is the hierarchy.</p>
        </div>
        <div class="fcard">
          <div class="ico">⚙</div>
          <h3>Built on proven tools</h3>
          <p>No proprietary runtime, no custom bundler. Every layer is something you can debug and swap.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- features ---------- */

.feat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media (max-width: 980px) {
  .feat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .feat-grid {
    grid-template-columns: 1fr;
  }
}

.fcard {
  border: var(--border);
  border-radius: var(--radius);
  padding: 24px 22px;
  background: var(--kx-bg-lift);
  transition: border-color 0.18s, transform 0.18s var(--ease),
    box-shadow 0.18s var(--ease);
}

.fcard:hover {
  border-color: var(--kx-accent-line);
  transform: translateY(-3px);
  box-shadow: var(--kx-shadow-card);
}

.fcard .ico {
  margin-bottom: 14px;
  font-family: var(--kx-font-mono);
  font-size: 20px;
  color: var(--kx-accent);
}

.fcard h3 {
  margin-bottom: 9px;
  font-size: 16.5px;
}

.fcard p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--kx-text-3);
}
</style>
