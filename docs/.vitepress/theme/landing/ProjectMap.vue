<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import Icon from "./Icon.vue";

/*
  A typical project at scale, drawn as columns over one shared base: every
  source folder runs its own stack under its own base URL, and every
  column wires down into the same install, types and build.

  The highlight walks the lanes on its own until the pointer takes over;
  it is decoration only, so the cards are plain list items with no
  keyboard stop.
*/
const folders = [
  { dir: "shop", base: "/", ui: "React", api: "Hono" },
  { dir: "admin", base: "/admin", ui: "Solid", api: "H3" },
  { dir: "webhooks", base: "/hooks", ui: "", api: "Hono" },
  { dir: "docs", base: "/docs", ui: "MDX", api: "" },
  { dir: "status", base: "/status", ui: "Vue", api: "Koa" },
];

const shared = [
  "one package.json",
  "one node_modules",
  "one set of types",
  "one build",
];

// lane centers and merge points on the 1000-wide connector canvas
const lanes = folders.map((_, i) => {
  const x = 100 + i * 200;
  const to = 500 + (x - 500) * 0.42;
  return `M${x} 0 C${x} 52, ${to} 40, ${to} 92`;
});

const active = ref(0);
const held = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const hold = (i: number) => {
  held.value = true;
  active.value = i;
};

const release = () => {
  held.value = false;
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  timer = setInterval(() => {
    if (!held.value && document.visibilityState === "visible") {
      active.value = (active.value + 1) % folders.length;
    }
  }, 2400);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<template>
  <figure class="map" aria-label="A typical KosmoJS project at scale">
    <div class="map-bar">
      <span class="path"><Icon name="folder" /> src/</span>
      <span class="status">
        <span class="pulse" aria-hidden="true" />
        A typical KosmoJS project at scale
      </span>
    </div>

    <ul class="lanes" @mouseleave="release">
      <li
        v-for="(f, i) in folders"
        :key="f.dir"
        class="lane-card"
        :class="{ on: active === i }"
        @mouseenter="hold(i)"
      >
        <span class="dir">{{ f.dir }}/</span>
        <span class="base">{{ f.base }}</span>
        <span class="stack">
          <span class="chip" :class="{ none: !f.ui }">
            <span class="k">ui</span>{{ f.ui || "no UI" }}
          </span>
          <span class="chip" :class="{ none: !f.api }">
            <span class="k">api</span>{{ f.api || "no API" }}
          </span>
        </span>
      </li>
    </ul>

    <svg class="merge" viewBox="0 0 1000 92" preserveAspectRatio="none" aria-hidden="true">
      <path
        v-for="(d, i) in lanes"
        :key="i"
        :d="d"
        class="wire"
        :class="{ on: active === i }"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="shared">
      <span v-for="item in shared" :key="item" class="seg">
        <Icon name="check" />
        {{ item }}
      </span>
    </div>

    <figcaption class="cap">- any number of folders, any stack each</figcaption>
  </figure>
</template>

<style scoped>
.map {
  position: relative;
  margin: 0;
  border: 1px solid var(--kx-line);
  border-radius: 22px;
  padding: 0 28px 26px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--kx-bg-lift) 92%, transparent),
      color-mix(in srgb, var(--kx-bg-sunk) 96%, transparent)
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--kx-text) 6%, transparent),
    var(--kx-shadow-pop);
  backdrop-filter: blur(10px);
}

/* a soft teal rim along the top edge */
.map::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--kx-accent-line),
    transparent
  );
}

.map-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 -28px 26px;
  border-bottom: 1px solid var(--kx-line-soft);
  padding: 14px 22px;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  color: var(--kx-text-3);
}

.map-bar .path {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--kx-text-2);
}

.map-bar .path :deep(svg) {
  width: 16px;
  height: 16px;
  color: var(--kx-accent);
}

.map-bar .status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.pulse {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--kx-brand);
}

.pulse::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--kx-brand);
  animation: pulse 2s var(--kx-ease) infinite;
}

@keyframes pulse {
  from {
    opacity: 0.8;
    transform: scale(0.5);
  }
  to {
    opacity: 0;
    transform: scale(1.6);
  }
}

/* ---------- lanes ---------- */

.lanes {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lane-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  border: 1px solid var(--kx-line);
  border-radius: 14px;
  padding: 16px 16px 14px;
  background-color: var(--kx-bg-lift);
  text-align: left;
  cursor: default;
  transition:
    border-color 0.3s,
    background-color 0.3s,
    transform 0.4s var(--kx-ease),
    box-shadow 0.4s var(--kx-ease);
}

.lane-card.on {
  border-color: var(--kx-accent-line);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--kx-brand) 9%, transparent),
      transparent 70%
    ),
    var(--kx-bg-lift);
  box-shadow: 0 18px 40px -26px var(--kx-brand-glow);
  transform: translateY(-4px);
}

.dir {
  font-family: var(--kx-font-mono);
  font-size: 13px;
  color: var(--kx-text-2);
}

.base {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--kx-font-display);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--kx-text);
  transition: color 0.3s;
}

.lane-card.on .base {
  color: var(--kx-accent);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-2);
}

.chip .k {
  width: 30px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--kx-text-4);
}

.chip.none {
  color: var(--kx-text-4);
}

/* ---------- merge wires ---------- */

.merge {
  display: block;
  width: 100%;
  height: 72px;
  overflow: visible;
}

.wire {
  fill: none;
  stroke: var(--kx-line-strong);
  stroke-width: 1.25;
  stroke-dasharray: 5 6;
  transition: stroke 0.3s;
}

.wire.on {
  stroke: var(--kx-accent);
  stroke-width: 1.75;
  animation: wire-run 0.9s linear infinite;
  filter: drop-shadow(0 0 4px var(--kx-brand-glow));
}

@keyframes wire-run {
  to {
    stroke-dashoffset: -22;
  }
}

/* ---------- shared base ---------- */

.shared {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 auto;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--kx-accent-line);
  border-radius: 14px;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--kx-brand) 6%, transparent),
      color-mix(in srgb, var(--kx-brand) 12%, transparent),
      color-mix(in srgb, var(--kx-brand) 6%, transparent)
    ),
    var(--kx-bg-sunk);
  overflow: hidden;
}

.seg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  color: var(--kx-text);
  white-space: nowrap;
}

.seg + .seg {
  border-left: 1px solid var(--kx-accent-line);
}

.seg :deep(svg) {
  width: 14px;
  height: 14px;
  color: var(--kx-accent);
}

.cap {
  margin-top: 16px;
  text-align: center;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-4);
}

@media (max-width: 900px) {
  .map {
    padding: 0 18px 22px;
  }

  .map-bar {
    margin: 0 -18px 20px;
    padding: 12px 18px;
  }

  .lanes {
    display: flex;
    gap: 12px;
    margin: 0 -18px;
    padding: 4px 18px 8px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .lanes::-webkit-scrollbar {
    display: none;
  }

  .lane-card {
    flex: 0 0 168px;
    scroll-snap-align: start;
  }

  .merge {
    display: none;
  }

  .shared {
    margin-top: 18px;
  }
}

@media (max-width: 560px) {
  .shared {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }

  .seg {
    padding: 10px 12px;
    font-size: 11.5px;
  }

  .seg + .seg {
    border-left: 0;
  }

  .seg:nth-child(even) {
    border-left: 1px solid var(--kx-accent-line);
  }

  .seg:nth-child(n + 3) {
    border-top: 1px solid var(--kx-accent-line);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse::after,
  .wire.on {
    animation: none;
  }

  .lane-card {
    transition: none;
  }
}
</style>
