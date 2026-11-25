<script setup lang="ts">
import Icon from "./Icon.vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();

const tools = [
  "Vite",
  "Hono",
  "H3",
  "Koa",
  "React",
  "Solid",
  "Vue",
  "Svelte",
  "MDX",
];
</script>

<template>
  <section class="section" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="section-head rise">
        <p class="eyebrow">what you get</p>
        <h2>Structure where it pays off.</h2>
        <p>
          With all features enabled out of the box,
          you forget about the tedious parts of a full-stack project.
          Multiple sub-projects merge into one coherent, scalable structure -
          which you don't have to maintain.
        </p>
      </div>

      <div class="bento">
        <article class="card fcard wide rise" style="--d: 0">
          <span class="glyph"><Icon name="tree" /></span>
          <h3>Directory-based routing</h3>
          <p>
            Your folder tree is the route map, for API and pages alike.
            Nothing to keep in sync.
          </p>
          <div class="viz routes" aria-hidden="true">
            <div class="route">
              <span class="file">api/users/<i>[id]</i>/index.ts</span>
              <span class="to" />
              <span class="url">/api/users/:id</span>
            </div>
            <div class="route">
              <span class="file">pages/users/<i>[id]</i>/index.tsx</span>
              <span class="to" />
              <span class="url">/users/:id</span>
            </div>
          </div>
        </article>

        <article class="card fcard wide rise" style="--d: 1">
          <span class="glyph"><Icon name="shield" /></span>
          <h3>End-to-end type safety</h3>
          <p>
            Write the type once. Runtime validation, a typed client,
            and an OpenAPI spec all derive from it.
          </p>
          <div class="viz fan" aria-hidden="true">
            <span class="src">type</span>
            <svg class="fan-lines" viewBox="0 0 100 90" preserveAspectRatio="none">
              <path d="M0 45 C50 45, 50 12, 100 12" vector-effect="non-scaling-stroke" />
              <path d="M0 45 L100 45" vector-effect="non-scaling-stroke" />
              <path d="M0 45 C50 45, 50 78, 100 78" vector-effect="non-scaling-stroke" />
            </svg>
            <span class="outs">
              <span>runtime validation</span>
              <span>typed client</span>
              <span>OpenAPI spec</span>
            </span>
          </div>
        </article>

        <article class="card fcard rise" style="--d: 0">
          <span class="glyph"><Icon name="swap" /></span>
          <h3>Isomorphic fetch</h3>
          <p>
            The same typed client runs on server and client.
            During SSR it calls the route in-process -
            no network hop, no server functions to define.
          </p>
        </article>

        <article class="card fcard rise" style="--d: 1">
          <span class="glyph"><Icon name="stream" /></span>
          <h3>Built-in streaming SSR</h3>
          <p>
            Flush the shell early and stream the rest - opt in per route.
            Each framework streams through its own native renderer.
          </p>
        </article>

        <article class="card fcard rise" style="--d: 2">
          <span class="glyph"><Icon name="layers" /></span>
          <h3>Cascading middleware</h3>
          <p>
            Drop a <span class="mono">use.ts</span> in any folder;
            it wraps everything beneath it. No imports, no wiring.
          </p>
        </article>

        <article class="card fcard rise" style="--d: 3">
          <span class="glyph"><Icon name="query" /></span>
          <h3>TanStack Query</h3>
          <p>
            Opt in per folder and the query client is wired for you -
            per-request on the server, singleton in the browser.
          </p>
        </article>

        <article class="card fcard wide rise" style="--d: 0">
          <span class="glyph"><Icon name="layout" /></span>
          <h3>Nested layouts</h3>
          <p>
            Compose shared shells - nav, sidebars, auth - at any depth.
            The file system is the hierarchy.
          </p>
          <div class="viz nest" aria-hidden="true">
            <div class="shell s1">
              <span class="tag">layout</span>
              <div class="shell s2">
                <span class="tag">layout</span>
                <div class="shell s3"><span class="tag">page</span></div>
              </div>
            </div>
          </div>
        </article>

        <article class="card fcard wide rise" style="--d: 1">
          <span class="glyph"><Icon name="cube" /></span>
          <h3>Built on proven tools</h3>
          <p>
            No proprietary runtime, no custom bundler.
            Every layer is something you can debug and swap.
          </p>
          <div class="viz tools" aria-hidden="true">
            <span v-for="t in tools" :key="t" class="tool">{{ t }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- features: bento ---------- */

.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.fcard {
  display: flex;
  flex-direction: column;
  padding: 26px 24px 26px;
}

.fcard.wide {
  grid-column: span 2;
}

@media (max-width: 980px) {
  .bento {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .bento {
    grid-template-columns: 1fr;
  }

  .fcard.wide {
    grid-column: auto;
  }
}

.fcard .glyph {
  margin-bottom: 22px;
}

.fcard h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.fcard p {
  max-width: 460px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--kx-text-3);
}

/* every visual sits at the foot of its card, on the card's own grid */
.viz {
  margin-top: auto;
  padding-top: 26px;
}

/* ---------- routing ---------- */

.routes {
  display: grid;
  gap: 8px;
}

.route {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--kx-line);
  border-radius: 10px;
  padding: 9px 12px;
  background-color: var(--kx-bg-inset);
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
}

.route .file {
  white-space: nowrap;
}

.route .file i {
  font-style: normal;
  color: var(--kx-accent);
}

.route .to {
  height: 1px;
  min-width: 16px;
  background: linear-gradient(
    90deg,
    var(--kx-line-strong),
    var(--kx-accent-line)
  );
}

.route .url {
  color: var(--kx-accent);
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .route {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .route .to {
    display: none;
  }
}

/* ---------- type fan-out ---------- */

.fan {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.fan .src {
  border: 1px solid var(--kx-accent-line);
  border-radius: 10px;
  padding: 10px 14px;
  background-color: var(--kx-accent-soft);
  font-family: var(--kx-font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--kx-accent);
}

.fan-lines {
  width: 100%;
  min-width: 40px;
  height: 108px;
}

.fan-lines path {
  fill: none;
  stroke: var(--kx-accent-line);
  stroke-width: 1.25;
  stroke-dasharray: 4 5;
}

.card:hover .fan-lines path {
  stroke: var(--kx-accent);
  animation: fan-run 0.9s linear infinite;
}

@keyframes fan-run {
  to {
    stroke-dashoffset: -18;
  }
}

.fan .outs {
  display: grid;
  gap: 10px;
}

.fan .outs span {
  border: 1px solid var(--kx-line);
  border-radius: 9px;
  padding: 6px 12px;
  background-color: var(--kx-bg-inset);
  font-family: var(--kx-font-mono);
  font-size: 12px;
  white-space: nowrap;
}

/* ---------- nested shells ---------- */

.nest .shell {
  position: relative;
  border: 1px solid var(--kx-line-strong);
  border-radius: 12px;
  padding: 26px 12px 12px;
}

.nest .s1 {
  background-color: var(--kx-bg-inset);
}

.nest .s2 {
  background-color: color-mix(in srgb, var(--kx-text) 3%, transparent);
}

.nest .s3 {
  height: 34px;
  padding: 0;
  border-color: var(--kx-accent-line);
  background-color: var(--kx-accent-soft);
  transition: background-color 0.3s;
}

.card:hover .nest .s3 {
  background-color: color-mix(in srgb, var(--kx-brand) 18%, transparent);
}

.nest .tag {
  position: absolute;
  top: 7px;
  left: 12px;
  font-family: var(--kx-font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--kx-text-4);
}

.nest .s3 .tag {
  top: 50%;
  transform: translateY(-50%);
  color: var(--kx-accent);
}

/* ---------- tool chips ---------- */

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool {
  border: 1px solid var(--kx-line);
  border-radius: 999px;
  padding: 6px 13px;
  background-color: var(--kx-bg-inset);
  font-family: var(--kx-font-mono);
  font-size: 12px;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.card:hover .tool {
  border-color: var(--kx-accent-line);
}

.tool:hover {
  color: var(--kx-accent);
}

@media (prefers-reduced-motion: reduce) {
  .card:hover .fan-lines path {
    animation: none;
  }
}
</style>
