<script setup lang="ts">
import { ref } from "vue";
import { useReveal } from "./reveal";

const { rootEl, ready } = useReveal();

const backend = ref<"koa" | "hono">("koa");
</script>

<template>
      <section class="section alt" id="loop" ref="rootEl" :class="{ 'is-ready': ready }">
        <div class="wrap">
          <div class="section-head rise">
            <p class="eyebrow">connected apps, provisioned</p>
            <h2>Structure and toolchain provided - you just add features.</h2>
          </div>

          <p class="loop-line loop-intro rise">You no longer manage repos or wrestle configs - you write business logic.</p>

          <div class="loop-cols rise">
            <!-- backend: the route -->
            <div class="codecard">
              <div class="panel-bar">
                <span class="fbadge ts">TS</span>
                <span class="tab">api/users/index.ts</span>
                <div class="minitabs" role="tablist" aria-label="Backend framework">
                  <button role="tab" :aria-selected="backend === 'koa'" @click="backend = 'koa'">Koa</button>
                  <button role="tab" :aria-selected="backend === 'hono'" @click="backend = 'hono'">Hono</button>
                </div>
              </div>
              <div class="codepane" v-show="backend === 'koa'">
  <pre><code><span class="t-kw">import</span> { <span class="t-prop">defineRoute</span> } <span class="t-kw">from</span> <span class="t-str">"_/api"</span>;

  <span class="t-kw">export default</span> <span class="t-fn">defineRoute</span>&lt;<span class="t-str">"users"</span>&gt;(({ <span class="t-prop">POST</span> }) =&gt; [
    <span class="t-fn">POST</span>&lt;{
      <span class="t-prop">json</span>: {
        <span class="t-prop">name</span>: <span class="t-type">string</span>;
        <span class="t-prop">email</span>: <span class="t-type">VRefine</span>&lt;<span class="t-type">string</span>, { <span class="t-prop">format</span>: <span class="t-str">"email"</span> }&gt;;
      };
    }&gt;(<span class="t-kw">async</span> (<span class="t-prop">ctx</span>) =&gt; {
      <span class="t-kw">const</span> { <span class="t-prop">name</span>, <span class="t-prop">email</span> } = <span class="t-prop">ctx</span>.<span class="t-prop">validated</span>.<span class="t-prop">json</span>;  <span class="t-com">// validated, typed</span>
      <span class="t-prop">ctx</span>.<span class="t-prop">body</span> = <span class="t-kw">await</span> <span class="t-fn">createUser</span>(<span class="t-prop">name</span>, <span class="t-prop">email</span>);
    }),
  ]);</code></pre>
              </div>
              <div class="codepane" v-show="backend === 'hono'">
  <pre><code><span class="t-kw">import</span> { <span class="t-prop">defineRoute</span> } <span class="t-kw">from</span> <span class="t-str">"_/api"</span>;

  <span class="t-kw">export default</span> <span class="t-fn">defineRoute</span>&lt;<span class="t-str">"users"</span>&gt;(({ <span class="t-prop">POST</span> }) =&gt; [
    <span class="t-fn">POST</span>&lt;{
      <span class="t-prop">json</span>: {
        <span class="t-prop">name</span>: <span class="t-type">string</span>;
        <span class="t-prop">email</span>: <span class="t-type">VRefine</span>&lt;<span class="t-type">string</span>, { <span class="t-prop">format</span>: <span class="t-str">"email"</span> }&gt;;
      };
    }&gt;(<span class="t-kw">async</span> (<span class="t-prop">ctx</span>) =&gt; {
      <span class="t-kw">const</span> { <span class="t-prop">name</span>, <span class="t-prop">email</span> } = <span class="t-prop">ctx</span>.<span class="t-prop">validated</span>.<span class="t-prop">json</span>;  <span class="t-com">// validated, typed</span>
      <span class="t-kw">return</span> <span class="t-prop">ctx</span>.<span class="t-meth">json</span>(<span class="t-kw">await</span> <span class="t-fn">createUser</span>(<span class="t-prop">name</span>, <span class="t-prop">email</span>), <span class="t-num">201</span>);
    }),
  ]);</code></pre>
              </div>
            </div>

            <!-- frontend: the page -->
            <div class="codecard">
              <div class="panel-bar">
                <svg class="ficon-react" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="2.1" fill="currentColor" /><g fill="none" stroke="currentColor" stroke-width="1"><ellipse rx="10" ry="3.8" /><ellipse rx="10" ry="3.8" transform="rotate(60)" /><ellipse rx="10" ry="3.8" transform="rotate(120)" /></g></svg>
                <span class="tab">pages/users/index.tsx</span>
                <span class="badge">React</span>
              </div>
  <pre><code><span class="t-com">// import generated clients</span>
  <span class="t-kw">import</span> <span class="t-prop">fetchClients</span> <span class="t-kw">from</span> <span class="t-str">"_/fetch"</span>;

  <span class="t-kw">const</span> { <span class="t-prop">POST</span> } = <span class="t-prop">fetchClients</span>[<span class="t-str">"users"</span>];

  <span class="t-kw">export default function</span> <span class="t-fn">Page</span>() {
    <span class="t-kw">const</span> <span class="t-prop">form</span> = <span class="t-fn">useForm</span>({ <span class="t-prop">name</span>: <span class="t-str">""</span>, <span class="t-prop">email</span>: <span class="t-str">""</span> });

    <span class="t-com">// fully typed and validated client-side</span>
    <span class="t-kw">const</span> <span class="t-prop">submit</span> = () =&gt; <span class="t-fn">POST</span>([], { <span class="t-prop">json</span>: <span class="t-prop">form</span>.<span class="t-prop">values</span> });

    <span class="t-kw">return</span> &lt;<span class="t-type">UserForm</span> <span class="t-prop">form</span>={<span class="t-prop">form</span>} <span class="t-prop">onSubmit</span>={<span class="t-prop">submit</span>} /&gt;;
  }</code></pre>
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

.minitabs {
  display: flex;
  margin-left: auto;
}

/* the underlined tab a docs code group draws, not a pill */
.minitabs button {
  position: relative;
  border: 0;
  padding: 0 12px;
  background: none;
  font-family: var(--kx-font-mono);
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 42px;
  color: var(--kx-code-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.minitabs button:hover,
.minitabs button[aria-selected="true"] {
  color: var(--kx-code-text);
}

.minitabs button[aria-selected="true"]::after {
  content: "";
  position: absolute;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 1px;
  background: var(--kx-accent);
}

/* reads as the language tag a docs code block shows in its corner */
.badge {
  margin-left: auto;
  padding-right: 12px;
  font-family: var(--kx-font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--kx-code-muted);
  opacity: 0.75;
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
