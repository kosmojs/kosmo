<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();

// the two halves of the split the prose describes, set as chips below it
const kept = [
  "routing conventions",
  "the validation pipeline",
  "middleware composition",
  "build orchestration",
];
const yours = ["frontend", "state", "styling", "database", "deploy target"];
</script>

<template>
  <section class="section diff" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="diff-head rise">
        <p class="eyebrow">how it differs</p>
        <h2>
          Opinionated about structure.<br />
          <span class="dim">Open about everything else.</span>
        </h2>
        <p>
          Most meta-frameworks pick your frontend for you and own your deploy model.
          Monorepo tools hand you flexibility and a configuration tax.
          Microservices give independence and a fragmented codebase.
        </p>
        <p>
          KosmoJS keeps the part that is <b>tedious to set up and easy to let erode</b> -
          routing conventions, the validation pipeline, middleware composition,
          build orchestration - and leaves the rest to you:
          <b>frontend, state, styling, database, deploy target.</b>
        </p>
      </div>

      <div class="split rise" aria-hidden="true">
        <div class="half kept">
          <span class="label">KosmoJS</span>
          <div class="chips">
            <span v-for="c in kept" :key="c" class="chip">{{ c }}</span>
          </div>
        </div>
        <span class="divider" />
        <div class="half yours">
          <span class="label">you</span>
          <div class="chips">
            <span v-for="c in yours" :key="c" class="chip">{{ c }}</span>
          </div>
        </div>
      </div>

      <p class="tagline rise">
        Structure that scales. <span class="dim">Choices that stay yours.</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* ---------- differ / philosophy ---------- */

.diff-head {
  max-width: 820px;
  margin: 0 auto;
  text-align: center;
}

.diff-head p:not(.eyebrow) {
  margin: 24px auto 0;
  max-width: 720px;
  font-size: 17.5px;
  color: var(--kx-text-3);
}

.diff-head p b {
  color: var(--kx-text);
}

/* ---------- the split ---------- */

.split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 28px;
  align-items: stretch;
  max-width: 960px;
  margin: 64px auto 0;
}

@media (max-width: 760px) {
  .split {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .split .divider {
    display: none;
  }
}

.half {
  border: 1px solid var(--kx-line);
  border-radius: var(--kx-radius);
  padding: 22px 22px 24px;
  background-color: var(--kx-bg-lift);
}

.half.kept {
  border-color: var(--kx-accent-line);
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--kx-brand) 9%, transparent),
      transparent 55%
    ),
    var(--kx-bg-lift);
}

.label {
  display: block;
  margin-bottom: 16px;
  font-family: var(--kx-font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--kx-text-4);
}

.kept .label {
  color: var(--kx-accent);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border-radius: 999px;
  padding: 6px 13px;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
}

.kept .chip {
  background-color: var(--kx-brand);
  color: var(--kx-brand-ink);
  font-weight: 500;
}

.yours .chip {
  border: 1px solid var(--kx-line-strong);
}

/* a vertical hairline between the halves, brightest at its center */
.divider {
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    var(--kx-accent-line) 50%,
    transparent
  );
}

.tagline {
  margin: 64px 0 0;
  text-align: center;
  font-family: var(--kx-font-display);
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--kx-text);
}
</style>
