<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { data as posts } from "../../../blog/posts.data";
import Icon from "./Icon.vue";
import ProjectMap from "./ProjectMap.vue";
import "./landing.css";

const lines = ["Many apps.", "One project.", "Zero glue."];

/*
  Each headline line is drawn twice in the same grid cell: a hidden ghost
  holding the full text, which fixes the line's width, and the typed text
  on top of it, pinned to the ghost's left edge. The headline is centered,
  so without the ghost every keystroke would re-center the line and the
  text would shuffle sideways as it types.
*/
const typed = ref(["", "", ""]);
const caretLine = ref(-1);

const latest = computed(() => posts[0]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTypewriter() {
  for (const [i, full] of lines.entries()) {
    caretLine.value = i;
    for (let n = 1; n <= full.length; n += 1) {
      typed.value[i] = full.slice(0, n);
      await sleep(55);
    }
    await sleep(380);
  }
  caretLine.value = -1;
}

function showHeroInstantly() {
  typed.value = [...lines];
  caretLine.value = -1;
}

/*
  The tour button targets a section this component does not own, so it
  looks the anchor up in the document rather than in its own subtree.
*/
function scrollToLoop() {
  const target = document.querySelector("#loop");
  if (!target) {
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
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
  <section class="hero">
    <div class="hero-stage">
      <div class="road" aria-hidden="true">
        <div class="plane" />
      </div>

      <div class="wrap hero-inner">
        <a v-if="latest" class="news" :href="latest.url">
          <span class="news-tag">New</span>
          <span class="news-title">{{ latest.title }}</span>
          <Icon name="arrow" class="news-arr" />
        </a>

        <p class="eyebrow">KosmoJS - the composable meta-framework</p>

        <h1 aria-label="Many apps. One project. Zero glue.">
          <span
            v-for="(line, i) in lines"
            :key="i"
            class="tw-line"
            :class="{ zero: i === 2 }"
            aria-hidden="true"
          >
            <span class="ghost">{{ line }}</span>
            <span class="typed">{{ typed[i] }}<span
              v-if="caretLine === i"
              class="tw-caret"
            /></span>
          </span>
          <noscript>
            <span class="nojs">Many apps.</span>
            <span class="nojs">One project.</span>
            <span class="nojs zero">Zero glue.</span>
          </noscript>
        </h1>

        <div class="lede-stack">
          <p class="lede">
            Most projects outgrow a single app.
            Most teams have a solution: monorepos, microservices,
            <span class="text-nowrap">DIY glue</span>.
          </p>
          <p class="lede">
            <b>
              KosmoJS composes several apps in a <span class="text-nowrap">scalable codebase</span>,
              offering both <span class="text-nowrap">consistency and flexibility</span>.
            </b>
          </p>
          <p class="lede">
            Apps run their own stacks, yet share one install,
            <span class="text-nowrap">one set of types</span>,
            <span class="text-nowrap">one build</span>.
          </p>
        </div>

        <div class="hero-cta">
          <a class="btn btn-primary" href="/start">
            Get started <Icon name="arrow" class="arr" />
          </a>
          <a class="btn btn-ghost" href="#loop" @click.prevent="scrollToLoop">
            Take the 60-second tour
          </a>
        </div>

        <ul class="hero-meta" aria-label="Supported stacks">
          <li><span class="k">api</span>Hono &middot; H3 &middot; Koa</li>
          <li>
            <span class="k">ui</span>React &middot; Solid &middot; Vue &middot; Svelte &middot; MDX
          </li>
          <li><span class="k">run</span>Node &middot; Bun &middot; Deno &middot; Workers</li>
          <li><span class="k">license</span>MIT</li>
        </ul>
      </div>
    </div>

    <div class="wrap map-wrap">
      <ProjectMap />
    </div>
  </section>
</template>

<style scoped>
/* ---------- hero ---------- */

.hero {
  position: relative;
  padding: 72px 0 120px;
}

/*
  The stage holds the headline block and the grid floor behind it - the
  floor the closing call to action uses, without its horizon light: here
  the light would sit right behind the copy, and the page's corner glow
  already does that job. The road is pinned below the foot of the block,
  so the floor fans out in the gap under the CTAs and the project map
  stands on it. It is tilted less than the shared one and faded in
  sooner, so more of it shows in that gap.
*/
.hero-stage {
  position: relative;
}

.hero-stage .road {
  top: auto;
  bottom: -170px;
  height: 560px;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 45%);
}

.hero-stage .road .plane {
  transform: perspective(700px) rotateX(48deg);
  -webkit-mask-image: radial-gradient(
    ellipse 70% 90% at 50% 100%,
    #000 40%,
    transparent 80%
  );
  mask-image: radial-gradient(
    ellipse 70% 90% at 50% 100%,
    #000 40%,
    transparent 80%
  );
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ---------- latest post pill ---------- */

.news {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  max-width: 100%;
  margin-bottom: 34px;
  border: 1px solid var(--kx-line);
  border-radius: 999px;
  padding: 5px 14px 5px 5px;
  background-color: color-mix(in srgb, var(--kx-bg-lift) 75%, transparent);
  backdrop-filter: blur(8px);
  font-size: 13.5px;
  color: var(--kx-text-2);
  transition:
    border-color 0.15s,
    background-color 0.15s;
}

.news:hover {
  border-color: var(--kx-accent-line);
  background-color: var(--kx-bg-lift);
}

.news-tag {
  flex: none;
  border-radius: 999px;
  padding: 3px 10px;
  background-color: var(--kx-brand);
  font-family: var(--kx-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--kx-brand-ink);
}

.news-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-arr {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--kx-accent);
  transition: transform 0.25s var(--kx-ease);
}

.news:hover .news-arr {
  transform: translateX(3px);
}

/* ---------- headline ---------- */

.hero h1 {
  margin: 0 0 30px;
  font-family: var(--kx-font-hero);
  font-size: clamp(46px, 8.4vw, 104px);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.tw-line {
  display: grid;
  justify-content: center;
}

.tw-line > .ghost,
.tw-line > .typed {
  grid-area: 1 / 1;
  white-space: nowrap;
}

.tw-line > .ghost {
  visibility: hidden;
}

.tw-line > .typed {
  justify-self: start;
  text-align: left;
}

/* the last line is painted in teal, a shade deeper toward its foot */
.tw-line.zero > .typed,
.nojs.zero {
  background: linear-gradient(
    180deg,
    var(--kx-brand-type-from) 10%,
    var(--kx-brand-type-to) 90%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /*
    A clipped background only paints inside the box, and the tight line
    height leaves descenders (the g) hanging below it. Extend the box down
    with padding and take the space back with a negative margin, so the
    paint reaches the descender without moving the line.
  */
  padding-bottom: 0.16em;
  margin-bottom: -0.16em;
}

.nojs {
  display: block;
}

/*
  The caret takes no room: its negative right margin cancels its width and
  left margin. At the end of a line the text already fills the ghost's
  width, so a caret with any advance of its own would widen the line by a
  hair and the centered line would shift left, then back when the caret
  moves on.
*/
.tw-caret {
  display: inline-block;
  width: 0.06em;
  height: 0.82em;
  margin-left: 0.06em;
  margin-right: -0.12em;
  border-radius: 2px;
  background-color: var(--kx-brand);
  box-shadow: 0 0 18px var(--kx-brand-glow);
  vertical-align: -0.04em;
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

/* ---------- lede ---------- */

.lede-stack {
  max-width: 640px;
  margin: 0 0 40px;
}

.lede {
  margin: 0 0 12px;
  font-size: 18.5px;
  line-height: 1.6;
  color: var(--kx-text-3);
}

.lede:last-child {
  margin-bottom: 0;
}

.lede b {
  color: var(--kx-text);
  font-weight: 600;
}

.hero-cta {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

/* ---------- stack line ---------- */

.hero-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  color: var(--kx-text-3);
}

.hero-meta li {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.hero-meta .k {
  border: 1px solid var(--kx-line);
  border-radius: 6px;
  padding: 1px 7px;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--kx-accent);
}

.map-wrap {
  margin-top: 140px;
}

@media (max-width: 760px) {
  .hero {
    padding: 48px 0 88px;
  }

  .lede {
    font-size: 17px;
  }

  .map-wrap {
    margin-top: 110px;
  }

  .hero-meta {
    gap: 10px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tw-caret {
    display: none;
  }
}
</style>
