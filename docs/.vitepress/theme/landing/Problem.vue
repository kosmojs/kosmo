<script setup lang="ts">
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();
</script>

<template>
  <section class="section alt" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="section-head rise">
        <p class="eyebrow">composable by nature</p>
        <h2>A project is never just one app.</h2>
        <p>New surfaces keep appearing - each wants its own routing, auth, and deploy story. The usual ways of splitting them apart all add maintenance overhead.</p>
      </div>
      <div class="cards3 rise">
        <div class="pcard">
          <h3>Microservices</h3>
          <p>Separate repos, separate pipelines, separate deploy configs. Shared types drift. A schema change turns into a cross-repo negotiation, and you spend more time on infrastructure than features.</p>
        </div>
        <div class="pcard">
          <h3>Monorepos</h3>
          <p>One repo, but now you maintain workspaces, package boundaries, internal dependency graphs, and build caches. The <span class="mono">packages/shared</span> folder slowly becomes a junk drawer. The tooling becomes its own project.</p>
        </div>
        <div class="pcard">
          <h3>DIY glue</h3>
          <p>Hand-wired scripts and a homegrown dev server that stitches the apps together. Cheap to build. Then a second developer joins and asks why <span class="mono">start-all.sh</span> passes <span class="mono">--legacy-peer-deps</span> - and nobody remembers.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- problem ---------- */

.cards3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

@media (max-width: 820px) {
  .cards3 {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.pcard {
  padding: 18px 0 0;
  background: none;
  border: 0;
  border-radius: 0;
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

.pcard h3 {
  margin-bottom: 10px;
  font-family: var(--kx-font-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--kx-text-2);
}

.pcard p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--kx-text-3);
}
</style>
