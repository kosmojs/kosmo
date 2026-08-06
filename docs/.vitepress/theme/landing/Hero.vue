<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useReveal } from "./reveal";
import "./landing.css";

const { rootEl, ready } = useReveal();

const line1 = ref("");
const line2 = ref("");
const line3 = ref("");
const caretLine = ref(0);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeInto(set: (v: string) => void, full: string, speed = 55) {
  for (let i = 1; i <= full.length; i += 1) {
    set(full.slice(0, i));
    await sleep(speed);
  }
}

// Type the headline out line by line, with a brief pause between lines.
async function runTypewriter() {
  caretLine.value = 1;
  await typeInto((v) => (line1.value = v), "Many apps.");
  await sleep(420);
  caretLine.value = 2;
  await typeInto((v) => (line2.value = v), "One project.");
  await sleep(420);
  caretLine.value = 3;
  await typeInto((v) => (line3.value = v), "Zero glue.");
  caretLine.value = 0;
}

// No animation: drop the full headline in at once.
function showHeroInstantly() {
  line1.value = "Many apps.";
  line2.value = "One project.";
  line3.value = "Zero glue.";
  caretLine.value = 0;
}

/*
  The tour button targets a section this component does not own, so it looks
  the anchor up in the document rather than in its own subtree.
*/
function scrollToLoop() {
  const target = document.querySelector("#loop");
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showHeroInstantly();
    return;
  }
  runTypewriter();
});
</script>

<template>
      <section class="hero" ref="rootEl" :class="{ 'is-ready': ready }">
        <div class="wrap hero-grid">
          <div>
            <p class="eyebrow">KosmoJS - the composable meta-framework</p>
            <h1 aria-label="Many apps. One project. Zero glue.">
              <span class="typed" aria-hidden="true"><span class="tw-line">{{ line1 }}<span v-if="caretLine === 1" class="tw-caret"></span></span><br /><span class="tw-line">{{ line2 }}<span v-if="caretLine === 2" class="tw-caret"></span></span><br /><span class="tw-line zero">{{ line3 }}<span v-if="caretLine === 3" class="tw-caret"></span></span></span>
              <noscript><span class="tw-line">Many apps.</span><br /><span class="tw-line">One project.</span><br /><span class="tw-line zero" style="color:#179299">Zero glue.</span></noscript>
            </h1>
            <div class="lede-stack">
              <p class="lede">
                Most projects outgrow a single app. Most teams have a solution: monorepos, microservices, DIY glue.
              </p>
              <p class="lede">
                <b>
                  KosmoJS composes several apps in a scalable codebase, offering both consistency and flexibility.
                </b>
              </p>
              <p class="lede">
                Apps run their own stacks, yet share one install, one set of types, one build.
              </p>
            </div>
            <div class="hero-cta">
              <a class="btn btn-primary" href="/start">Get started <span class="arr">➜</span></a>
              <a class="btn btn-ghost" href="#loop" @click.prevent="scrollToLoop">Take the 60-second tour</a>
            </div>
            <div class="hero-meta">
              <span>Koa · Hono</span>
              <span>React · Solid · Vue · Svelte · MDX</span>
              <span>Node · Bun · Deno · Workers</span>
              <span>MIT</span>
            </div>
          </div>

          <!-- a typical project at scale: many concerns, one codebase -->
          <div class="panel panel-tree">
            <div class="panel-bar">
              <svg class="ficon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
              <span class="tab">a typical KosmoJS project at scale</span>
            </div>
  <pre><code><span class="tb">src/</span>
  <span class="tb">├─ </span><span class="td">shop/</span>       <span class="tp">/</span>          <span class="ts">React + Hono</span>
  <span class="tb">├─ </span><span class="td">admin/</span>      <span class="tp">/admin</span>     <span class="ts">Solid + Koa</span>
  <span class="tb">├─ </span><span class="td">webhooks/</span>   <span class="tp">/hooks</span>     <span class="ts">Hono, no UI</span>
  <span class="tb">├─ </span><span class="td">docs/</span>       <span class="tp">/docs</span>      <span class="ts">MDX, no API</span>
  <span class="tb">└─ </span><span class="td">status/</span>     <span class="tp">/status</span>    <span class="ts">Vue + Hono</span></code></pre>
            <div class="tree-cap">- any number of folders, any stack each</div>
          </div>
        </div>
      </section>
</template>

<style scoped>
/* ---------- hero ---------- */

.hero {
  padding: 84px 0 88px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 56px;
  align-items: center;
}

.hero h1 {
  margin: 0 0 22px;
  font-size: clamp(40px, 6.2vw, 68px);
  font-weight: 700;
  letter-spacing: -0.035em;
  /* reserve 3 lines (line-height 1.08) so typing does not shift the page */
  min-height: 3.24em;
}

.hero h1 .zero {
  color: var(--kx-accent-2);
  white-space: nowrap;
}

.hero h1 .tw-caret {
  display: inline-block;
  width: 3px;
  height: 0.9em;
  margin-left: 5px;
  background: var(--kx-accent);
  vertical-align: -0.06em;
  animation: caretBlink 1s steps(1, end) infinite;
}

@keyframes caretBlink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero h1 .tw-caret {
    display: none;
  }
}

.lede {
  max-width: 540px;
  margin: 0 0 32px;
  font-size: 18px;
  color: var(--kx-text-3);
}

.lede-stack {
  margin: 0 0 32px;
}

.lede-stack .lede {
  margin-bottom: 12px;
}

.lede-stack .lede:last-child {
  margin-bottom: 0;
}

.lede b {
  color: var(--kx-text);
  font-weight: 600;
}

.hero-cta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.hero-meta {
  display: flex;
  gap: 8px 20px;
  flex-wrap: wrap;
  margin-top: 30px;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  color: var(--kx-text-4);
}

.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.hero-meta span::before {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--kx-accent-2);
  opacity: 0.7;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
</style>
