<script setup lang="ts">
import { computed, ref } from "vue";

import Icon from "./Icon.vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();

const managers = ["pnpm", "npm", "yarn"] as const;
const pm = ref<(typeof managers)[number]>("pnpm");
const command = computed(() => `${pm.value} create kosmo`);

const copied = ref(false);
let reset: ReturnType<typeof setTimeout> | undefined;

function copyCmd() {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }
  navigator.clipboard.writeText(command.value).then(() => {
    copied.value = true;
    clearTimeout(reset);
    reset = setTimeout(() => {
      copied.value = false;
    }, 1400);
  });
}
</script>

<template>
  <section class="section cta-final" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="wrap">
      <div class="panel rise">
        <div class="road" aria-hidden="true">
          <div class="horizon" />
          <div class="plane" />
        </div>

        <div class="panel-body">
          <h2>Zero to a working route in couple minutes</h2>
          <p>
            Scaffold a project, add a source folder, pick your stack.<br />
            The dev server does the rest.
          </p>

          <div class="install">
            <div class="pm" role="tablist" aria-label="Package manager">
              <button
                v-for="m in managers"
                :key="m"
                role="tab"
                :aria-selected="pm === m"
                :class="{ on: pm === m }"
                @click="pm = m"
              >
                {{ m }}
              </button>
            </div>
            <div class="cmd-row">
              <code class="cmd"><span class="prompt">$</span> {{ command }}</code>
              <button
                class="copy"
                :class="{ copied }"
                :aria-label="copied ? 'Copied' : 'Copy command'"
                @click="copyCmd"
              >
                <Icon :name="copied ? 'check' : 'copy'" />
                <span>{{ copied ? "copied" : "copy" }}</span>
              </button>
            </div>
          </div>

          <div class="cta-row">
            <a class="btn btn-primary" href="/start">
              Read the quick start <Icon name="arrow" class="arr" />
            </a>
            <a
              class="btn btn-ghost"
              href="https://github.com/kosmojs/kosmo"
              target="_blank"
              rel="noopener"
            >
              <Icon name="github" class="gh" /> Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- final cta ---------- */

.cta-final {
  padding-top: 40px;
}

.panel {
  position: relative;
  border: 1px solid var(--kx-line);
  border-radius: 28px;
  background:
    radial-gradient(
      ellipse 70% 60% at 50% 0%,
      color-mix(in srgb, var(--kx-brand) 10%, transparent),
      transparent 70%
    ),
    var(--kx-bg-sunk);
  overflow: hidden;
  isolation: isolate;
  box-shadow: var(--kx-shadow-pop);
}

.panel .road {
  z-index: -1;
  top: 30%;
}

.panel-body {
  padding: 88px 28px 96px;
  text-align: center;
}

@media (max-width: 600px) {
  .panel-body {
    padding: 64px 20px 72px;
  }
}

.panel h2 {
  font-size: clamp(32px, 5vw, 56px);
}

.panel p {
  max-width: 520px;
  margin: 20px auto 40px;
  font-size: 18px;
  color: var(--kx-text-3);
}

/* ---------- install ---------- */

.install {
  display: inline-flex;
  flex-direction: column;
  max-width: 100%;
  margin-bottom: 36px;
  border: 1px solid var(--kx-line);
  border-radius: 14px;
  background-color: var(--kx-bg-code);
  box-shadow: var(--kx-shadow-card);
  text-align: left;
  overflow: hidden;
}

.pm {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--kx-line-soft);
  padding: 0 10px;
}

.pm button {
  position: relative;
  padding: 9px 10px;
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-4);
  transition: color 0.15s;
}

.pm button:hover,
.pm button.on {
  color: var(--kx-text);
}

.pm button.on::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background-color: var(--kx-accent);
}

.cmd-row {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 14px 14px 14px 20px;
}

.cmd {
  flex: 1;
  font-family: var(--kx-font-mono);
  font-size: 15px;
  color: var(--kx-text);
  white-space: nowrap;
}

.prompt {
  color: var(--kx-accent);
}

.copy {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--kx-line);
  border-radius: 8px;
  padding: 6px 11px;
  background-color: var(--kx-bg-lift);
  font-family: var(--kx-font-mono);
  font-size: 12px;
  color: var(--kx-text-3);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.copy :deep(svg) {
  width: 14px;
  height: 14px;
}

.copy:hover {
  border-color: var(--kx-accent-line);
  color: var(--kx-text);
}

.copy.copied {
  border-color: var(--kx-accent-line);
  color: var(--kx-accent);
}

.cta-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.gh {
  width: 16px;
  height: 16px;
}
</style>
