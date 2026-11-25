<script setup lang="ts">
import Icon from "./Icon.vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="section-head rise">
        <p class="eyebrow">composable by nature</p>
        <h2>A project is never just one app.</h2>
        <p>
          New surfaces keep appearing - each wants its own routing, auth, and deploy story.
          The usual ways of splitting them apart all add maintenance overhead.
        </p>
      </div>

      <div class="cards3">
        <article class="card pcard rise" style="--d: 0">
          <div class="pcard-top">
            <span class="glyph"><Icon name="services" /></span>
            <span class="num">01</span>
          </div>
          <h3>Microservices</h3>
          <p>
            Separate repos, separate pipelines, separate deploy configs. Shared types drift.
            A schema change turns into a cross-repo negotiation,
            and you spend more time on infrastructure than features.
          </p>
        </article>
        <article class="card pcard rise" style="--d: 1">
          <div class="pcard-top">
            <span class="glyph"><Icon name="monorepo" /></span>
            <span class="num">02</span>
          </div>
          <h3>Monorepos</h3>
          <p>
            One repo, but now you maintain workspaces, package boundaries,
            internal dependency graphs, and build caches.
            The <span class="mono">packages/shared</span> folder slowly becomes a junk drawer.
            The tooling becomes its own project.
          </p>
        </article>
        <article class="card pcard rise" style="--d: 2">
          <div class="pcard-top">
            <span class="glyph"><Icon name="glue" /></span>
            <span class="num">03</span>
          </div>
          <h3>DIY glue</h3>
          <p>
            Hand-wired scripts and a homegrown dev server that stitches the apps together.
            Cheap to build. Then a second developer joins and asks why
            <span class="mono">start-all.sh</span> passes
            <span class="mono">--legacy-peer-deps</span> - and nobody remembers.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- problem ---------- */

.cards3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 860px) {
  .cards3 {
    grid-template-columns: 1fr;
  }
}

.pcard {
  padding: 26px 26px 28px;
}

.pcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.num {
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-4);
}

.pcard h3 {
  margin-bottom: 12px;
  font-size: 21px;
}

.pcard p {
  font-size: 15px;
  line-height: 1.65;
  color: var(--kx-text-3);
}

/* the cost of each workaround reads in a warm hue, not the brand teal */
.pcard .glyph {
  color: var(--kx-amber);
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--kx-amber) 10%, transparent),
      transparent 60%
    ),
    var(--kx-bg-sunk);
}

.pcard .mono {
  color: var(--kx-text-2);
}
</style>
