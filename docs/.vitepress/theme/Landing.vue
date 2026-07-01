<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useData } from "vitepress";

const rootEl = ref<HTMLElement | null>(null);
const ready = ref(false);
const backend = ref<"koa" | "hono">("koa");
const copyLabel = ref("copy");

// Hero headline typewriter
const line1 = ref("");
const line2 = ref("");
const line3 = ref("");
const caretLine = ref(0);

// Light/dark, kept in sync with VitePress's own appearance state so the
// choice persists and carries over to the docs pages.
const { isDark } = useData();
const dark = ref(isDark.value);

function setTheme(v: boolean) {
  dark.value = v;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", v);
  }
  try {
    localStorage.setItem("vitepress-theme-appearance", v ? "dark" : "light");
  } catch {}
  // also nudge VitePress's ref when it is writable (no-op otherwise)
  try {
    isDark.value = v;
  } catch {}
}
function toggleTheme() {
  setTheme(!dark.value);
}

function copyCmd() {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText("pnpm create kosmo").then(() => {
      copyLabel.value = "copied";
      setTimeout(() => (copyLabel.value = "copy"), 1400);
    });
  }
}

function scrollToLoop() {
  const target = rootEl.value?.querySelector("#loop") as HTMLElement | null;
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

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

onMounted(() => {
  // reconcile with whatever VitePress applied (system/stored) on this load
  dark.value = document.documentElement.classList.contains("dark");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    showHeroInstantly(); // headline must still appear, just without motion
    return; // leave everything else visible, no motion
  }

  runTypewriter(); // type the headline out

  ready.value = true; // enables the pre-hide + scroll-reveal styles

  const root = rootEl.value;
  if (!root) return;
  const rises = root.querySelectorAll<HTMLElement>(".rise");

  if (!("IntersectionObserver" in window)) {
    rises.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  rises.forEach((el) => io.observe(el));
});
</script>

<template>
  <div class="kosmo-landing" ref="rootEl" :class="{ 'is-ready': ready }">
    <div class="cosmos" aria-hidden="true"></div>

    <header class="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="/">
          <span class="glyph">K</span> KosmoJS
        </a>
        <nav class="nav-links">
          <a href="/about.html">About</a>
          <a href="/features.html">Features</a>
          <a href="/start.html">Quick start</a>
          <a href="/tutorial.html">Tutorial</a>
          <button
            class="nav-toggle"
            @click="toggleTheme"
            :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'"
            :title="dark ? 'Light' : 'Dark'"
          >
            <svg v-if="dark" class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
            <svg v-else class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          </button>
        </nav>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero">
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
              <b>KosmoJS does both - it combines monorepo consistency with microservice flexibility by composing several apps in one codebase.</b>
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
            <span>React · Solid · Vue · MDX</span>
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

    <!-- PROBLEM -->
    <section class="section alt">
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

    <!-- SOLUTION: source folders -->
    <section class="section">
      <div class="wrap">
        <div class="rise sol-block">
          <p class="eyebrow">built on Vite</p>
          <h2 class="h2-md">Source folders.</h2>
          <p class="sol-lead">
            One folder per concern. A source folder is whatever you need it to be -
            a public site, an internal tool, a backend-only webhook handler, a docs site -
            each with its own backend and frontend framework, base URL, and build output.
            None of them are separate packages.
          </p>
          <ul class="sol-points">
            <li><span class="ok">OK</span><span>One <b>package.json</b>, one <b>node_modules</b>, one set of <b>types</b> shared across every folder.</span></li>
            <li><span class="ok">OK</span><span>Need a type from the customer app in the admin panel? <b>Import it.</b> Change a model and every folder sees it immediately.</span></li>
            <li><span class="ok">OK</span><span>One command starts them all. One builds them all. Or build a <b>single folder</b> when that is all you need.</span></li>
            <li><span class="ok">OK</span><span>No publishing, no versioning, no workspace protocols. The directory structure <b>enforces boundaries</b> code review can't.</span></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CORE LOOP -->
    <section class="section alt" id="loop">
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
        <p class="loop-note"><span class="t-kw">[id]</span> required <span class="sep">·</span> <span class="t-kw">{id}</span> optional <span class="sep">·</span> <span class="t-kw">{...path}</span> splat <span class="sep">—</span> identical syntax for API routes and pages. Solid, Vue and MDX pages follow the same shape.</p>

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

    <!-- FEATURES -->
    <section class="section">
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

    <!-- DIFFERS / PHILOSOPHY -->
    <section class="section alt diff">
      <div class="wrap rise">
        <p class="eyebrow">how it differs</p>
        <h2>Opinionated about structure. Open about everything else.</h2>
        <p>
          Most meta-frameworks pick your frontend for you and own your deploy model. Monorepo tools hand
          you flexibility and a configuration tax. Microservices give independence and a fragmented codebase.
          KosmoJS keeps the part that is <b>tedious to set up and easy to let erode</b> - routing conventions,
          the validation pipeline, middleware composition, build orchestration - and leaves the rest to you:
          <b>frontend, state, styling, database, deploy target.</b>
        </p>
        <p class="tagline">Structure that scales. <span class="dim">Choices that stay yours.</span></p>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="section cta-final">
      <div class="wrap rise">
        <h2>Zero to a working route in five minutes.</h2>
        <p>Scaffold a project, add a source folder, pick your stack. The dev server does the rest.</p>
        <div class="install">
          <span><span class="prompt">$</span> <span class="cmd">pnpm create kosmo</span></span>
          <button :class="{ copied: copyLabel === 'copied' }" @click="copyCmd" aria-label="Copy command">{{ copyLabel }}</button>
        </div>
        <div class="cta-row">
          <a class="btn btn-primary" href="/start">Read the quick start <span class="arr">➜</span></a>
          <a class="btn btn-ghost" href="https://github.com/kosmojs/kosmo" target="_blank" rel="noopener">Star on GitHub ↗</a>
        </div>
      </div>
    </section>

    <footer class="foot">
      <div class="wrap foot-inner">
        <a class="brand" href="/"><span class="glyph">K</span> KosmoJS</a>
        <nav class="foot-links">
          <a href="/about">About</a>
          <a href="/features">Features</a>
          <a href="/routing/intro">Routing</a>
          <a href="/validation/intro">Validation</a>
          <a href="https://github.com/kosmojs/kosmo" target="_blank" rel="noopener">GitHub</a>
        </nav>
        <div class="foot-copy">
          Named after the Greek <span class="mono greek">Kosmos (κόσμος)</span> - order, world.
          &nbsp;·&nbsp; Released under the MIT License. &nbsp;·&nbsp; © 2025-present Slee Woo
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.kosmo-landing {
  /* Catppuccin Latte (light, default) */
  --base:    #eff1f5;
  --mantle:  #e6e9ef;
  --crust:   #dce0e8;
  --surface0:#ccd0da;
  --surface1:#bcc0cc;
  --surface2:#acb0be;
  --overlay0:#9ca0b0;
  --overlay1:#8c8fa1;
  --overlay2:#7c7f93;
  --subtext0:#6c6f85;
  --subtext1:#5c5f77;
  --text:    #4c4f69;
  --lavender:#7287fd;
  --blue:    #1e66f5;
  --sapphire:#209fb5;
  --teal:    #179299;
  --green:   #40a02b;
  --yellow:  #df8e1d;
  --peach:   #fe640b;
  --red:     #d20f39;
  --mauve:   #8839ef;
  --accent: var(--mauve);

  --sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --maxw: 1120px;
  --radius: 14px;
  --border: 1px solid var(--surface0);
  --ease: cubic-bezier(.16,1,.3,1);

  position: relative;
  min-height: 100vh;
  background: var(--base);
  color: var(--text);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Catppuccin Mocha (dark) - driven by VitePress's html.dark class */
.dark .kosmo-landing {
  --base:    #1e1e2e;
  --mantle:  #181825;
  --crust:   #11111b;
  --surface0:#313244;
  --surface1:#45475a;
  --surface2:#585b70;
  --overlay0:#6c7086;
  --overlay1:#7f849c;
  --overlay2:#9399b2;
  --subtext0:#a6adc8;
  --subtext1:#bac2de;
  --text:    #cdd6f4;
  --lavender:#b4befe;
  --blue:    #89b4fa;
  --sapphire:#74c7ec;
  --teal:    #94e2d5;
  --green:   #a6e3a1;
  --yellow:  #f9e2af;
  --peach:   #fab387;
  --red:     #f38ba8;
  --mauve:   #cba6f7;
}

/* Code surfaces stay dark in both themes (dark code on a light page reads as
   intentional). Setting the Mocha tokens directly on these containers wins for
   their subtrees over the inherited page palette. */
.panel,
.codecard,
.install {
  --base:#1e1e2e; --mantle:#181825; --crust:#11111b;
  --surface0:#313244; --surface1:#45475a; --surface2:#585b70;
  --overlay0:#6c7086; --overlay1:#7f849c; --overlay2:#9399b2;
  --subtext0:#a6adc8; --subtext1:#bac2de; --text:#cdd6f4;
  --lavender:#b4befe; --blue:#89b4fa; --sapphire:#74c7ec; --teal:#94e2d5;
  --green:#a6e3a1; --yellow:#f9e2af; --peach:#fab387; --red:#f38ba8; --mauve:#cba6f7;
  color: var(--text);
}

.kosmo-landing * { box-sizing: border-box; }

/* ambient cosmos glow, very restrained */
.cosmos {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(680px 420px at 78% -8%, rgba(136,57,239,.06), transparent 70%),
    radial-gradient(540px 380px at 8% 18%, rgba(30,102,245,.05), transparent 70%);
}
.dark .cosmos {
  background:
    radial-gradient(680px 420px at 78% -8%, rgba(203,166,247,.12), transparent 70%),
    radial-gradient(540px 380px at 8% 18%, rgba(137,180,250,.08), transparent 70%);
}

.kosmo-landing a { color: inherit; text-decoration: none; }

.wrap {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 28px;
  position: relative;
  z-index: 1;
}

.eyebrow {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .02em;
  color: var(--accent);
  margin: 0 0 18px;
}
.eyebrow::before { content: "// "; color: var(--overlay0); }

.kosmo-landing h1,
.kosmo-landing h2,
.kosmo-landing h3 { font-weight: 600; line-height: 1.08; letter-spacing: -.02em; margin: 0; }

.mono { font-family: var(--mono); color: var(--blue); }

/* ---------- nav ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--base) 78%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--surface0) 60%, transparent);
}
.nav-inner {
  display: flex;
  align-items: center;
  gap: 22px;
  height: 64px;
}
.brand {
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; font-size: 18px; letter-spacing: -.02em;
  margin-right: auto;
}
.brand .glyph {
  font-family: var(--mono);
  color: var(--accent);
  border: 1px solid var(--surface1);
  border-radius: 8px;
  width: 30px; height: 30px;
  display: grid; place-items: center;
  font-size: 16px; font-weight: 700;
  background: var(--mantle);
}
.nav-links { display: flex; gap: 22px; align-items: center; }
.nav-links a { color: var(--subtext1); font-size: 15px; transition: color .15s; }
.nav-links a:hover { color: var(--text); }
.nav-gh {
  font-family: var(--mono); font-size: 13px;
  color: var(--subtext0);
  border: var(--border); border-radius: 8px;
  padding: 7px 12px; transition: border-color .15s, color .15s;
}
.nav-gh:hover { color: var(--text); border-color: var(--surface2); }
@media (max-width: 760px) { .nav-links a:not(.nav-gh) { display: none; } }

/* ---------- buttons ---------- */
.btn {
  display: inline-flex; align-items: center; gap: 9px;
  font-family: var(--mono); font-size: 14px; font-weight: 500;
  padding: 13px 20px; border-radius: 10px;
  border: 1px solid transparent; cursor: pointer;
  transition: transform .15s var(--ease), background .15s, border-color .15s, color .15s;
}
.btn:active { transform: translateY(1px); }
.btn-primary {
  background: var(--accent); color: var(--crust); font-weight: 600;
  box-shadow: 0 0 0 1px rgba(203,166,247,.35), 0 10px 30px -12px rgba(203,166,247,.6);
}
.btn-primary:hover { background: var(--lavender); }
.btn-ghost { color: var(--subtext1); border-color: var(--surface1); }
.btn-ghost:hover { color: var(--text); border-color: var(--surface2); background: var(--mantle); }
.btn .arr { transition: transform .2s var(--ease); }
.btn:hover .arr { transform: translateX(3px); }

/* The scoped `a { color: inherit }` rule outranks .btn-* on specificity,
   so pin the label colors with an equally-specific, later rule. */
.kosmo-landing a.btn-primary { color: var(--crust); }
.kosmo-landing a.btn-ghost { color: var(--subtext1); }
.kosmo-landing a.btn-ghost:hover { color: var(--text); }

/* ---------- theme toggle ---------- */
.nav-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; flex: none;
  color: var(--subtext0);
  background: none;
  border: var(--border); border-radius: 8px;
  cursor: pointer; transition: color .15s, border-color .15s, background .15s;
}
.nav-toggle:hover { color: var(--text); border-color: var(--surface2); background: var(--mantle); }
.nav-toggle .ti { width: 17px; height: 17px; }

/* ---------- sections ---------- */
.section { padding: 96px 0; }
.section.alt { background: var(--mantle); border-block: 1px solid color-mix(in srgb, var(--surface0) 50%, transparent); }
.section-head { max-width: 680px; margin-bottom: 48px; }
.section-head h2 { font-size: clamp(28px, 4vw, 40px); }
.section-head p:not(.eyebrow) { color: var(--subtext0); font-size: 18px; margin: 16px 0 0; }

/* ---------- hero ---------- */
.hero { padding: 84px 0 88px; }
.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 56px;
  align-items: center;
}
.hero h1 {
  font-size: clamp(40px, 6.2vw, 68px);
  min-height: 3.24em; /* reserve 3 lines (line-height 1.08) so typing doesn't shift the page */
  margin: 0 0 22px;
}
.hero h1 .zero { color: var(--teal); white-space: nowrap; }
.hero h1 .tw-caret {
  display: inline-block; width: 3px; height: 0.9em;
  margin-left: 5px; background: currentColor; vertical-align: -0.06em;
  animation: caretBlink 1s steps(1, end) infinite;
}
@keyframes caretBlink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .hero h1 .tw-caret { display: none; } }
.lede {
  font-size: 19px; color: var(--subtext1);
  max-width: 540px; margin: 0 0 32px;
}
.lede-stack { margin: 0 0 32px; }
.lede-stack .lede { margin-bottom: 12px; }
.lede-stack .lede:last-child { margin-bottom: 0; }
.lede b { color: var(--text); font-weight: 600; }
.hero-cta { display: flex; gap: 14px; flex-wrap: wrap; }
.hero-meta {
  margin-top: 30px; display: flex; gap: 8px 20px; flex-wrap: wrap;
  font-family: var(--mono); font-size: 13px; color: var(--overlay1);
}
.hero-meta span { display: inline-flex; align-items: center; gap: 7px; }
.hero-meta span::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--surface2); }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; gap: 40px; }
}

/* ---------- code panel (signature) ---------- */
.panel {
  background: var(--crust);
  border: var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 40px 80px -40px rgba(0,0,0,.7);
}
.panel-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--surface0);
  background: var(--mantle);
}
.panel-bar .ficon { width: 15px; height: 15px; color: var(--overlay1); flex: none; }
.panel-bar .ficon-react { width: 16px; height: 16px; color: #61dafb; flex: none; }
.fbadge {
  display: inline-grid; place-items: center; min-width: 18px; height: 16px;
  padding: 0 3px; border-radius: 4px; background: #3178c6; color: #fff;
  font-family: var(--mono); font-weight: 700; font-size: 9px; letter-spacing: .03em; flex: none;
}
.panel-bar .tab {
  margin-left: 4px; font-family: var(--mono); font-size: 12.5px; color: var(--overlay1);
}
.panel pre {
  margin: 0; padding: 22px 22px 24px;
  font-family: var(--mono); font-size: 13.5px; line-height: 1.85;
  overflow-x: auto;
}
.panel code { font-family: var(--mono); white-space: pre; }

/* hero source-folder tree panel */
.panel-tree pre { padding-bottom: 14px; }
.tb { color: var(--surface2); }
.td { color: var(--blue); }
.tp { color: var(--teal); }
.ts { color: var(--subtext0); }
.tree-cap {
  padding: 0 22px 18px;
  font-family: var(--mono); font-size: 12px; color: var(--overlay0);
}

/* syntax tokens */
.t-kw   { color: var(--mauve); }
.t-fn   { color: var(--blue); }
.t-str  { color: var(--green); }
.t-num  { color: var(--peach); }
.t-type { color: var(--yellow); }
.t-com  { color: var(--overlay0); font-style: italic; }
.t-prop { color: var(--text); }
.t-meth { color: var(--blue); }
.t-path { color: var(--teal); }

/* ---------- problem ---------- */
.cards3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
@media (max-width: 820px) { .cards3 { grid-template-columns: 1fr; gap: 20px; } }
.pcard {
  border: none; border-radius: 0; background: none;
  padding: 16px 0 0; border-top: 1px solid var(--surface0);
}
.section.alt .pcard { background: none; }
.pcard h3 {
  font-family: var(--mono); font-size: 13.5px; font-weight: 600;
  color: var(--subtext1); margin-bottom: 9px;
}
.pcard p { color: var(--subtext0); font-size: 14.5px; margin: 0; line-height: 1.6; }

/* ---------- source folders ---------- */
.sol-block { max-width: 760px; }
.h2-md { font-size: clamp(28px, 4vw, 42px); }
.sol-lead { color: var(--subtext0); font-size: 18px; margin: 16px 0 0; }
.sol-points { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 16px; }
.sol-points li { display: flex; gap: 13px; color: var(--subtext1); font-size: 16px; align-items: flex-start; }
.sol-points li .ok { color: var(--green); font-family: var(--mono); flex: none; margin-top: 2px; }
.sol-points li b { color: var(--text); font-weight: 600; }

/* ---------- core loop ---------- */

.codecard { background: var(--crust); border: var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: 0 40px 80px -44px rgba(0,0,0,.6); }
.codecard pre { margin: 0; padding: 22px 24px; font-family: var(--mono); font-size: 13.5px; line-height: 1.85; overflow-x: auto; }

.loop-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
@media (max-width: 860px){ .loop-cols { grid-template-columns: 1fr; } }
.loop-cols .codecard pre { font-size: 13px; }
.minitabs { margin-left: auto; display: flex; gap: 4px; }
.minitabs button {
  font-family: var(--mono); font-size: 12px; color: var(--overlay1);
  background: none; border: 1px solid transparent; border-radius: 6px;
  padding: 4px 10px; cursor: pointer; transition: color .15s, background .15s, border-color .15s;
}
.minitabs button:hover { color: var(--text); }
.minitabs button[aria-selected="true"] { color: var(--text); background: var(--surface0); border-color: var(--surface1); }
.badge {
  margin-left: auto; font-family: var(--mono); font-size: 12px; color: var(--subtext0);
  border: 1px solid var(--surface1); border-radius: 6px; padding: 4px 10px;
}
.loop-note {
  text-align: center; font-family: var(--mono); font-size: 13.5px;
  color: var(--overlay1); margin: 26px 0 0;
}
.loop-note .t-kw { color: var(--mauve); }
.loop-note .sep { color: var(--surface2); margin: 0 5px; }
@media (max-width: 560px){ .loop-note { font-size: 12px; } }

/* full-width intro / closing lines (no max-width, no forced break) */
#loop .section-head { margin-bottom: 28px; }
.loop-line { font-size: 19px; color: var(--subtext1); line-height: 1.5; margin: 0; }
.loop-intro { margin-bottom: 30px; }

/* 2x2 mechanism grid - pcard manner, no header, regular size */
.loop-feats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px 44px; margin: 36px 0 40px; }
@media (max-width: 820px){ .loop-feats { grid-template-columns: 1fr; gap: 22px; } }
.lfeat { border-top: 1px solid var(--surface0); padding: 16px 0 0; color: var(--subtext1); font-size: 16px; line-height: 1.55; }

/* ---------- features ---------- */
.feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
@media (max-width: 980px){ .feat-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 560px){ .feat-grid { grid-template-columns: 1fr; } }
.fcard {
  border: var(--border); border-radius: var(--radius); padding: 24px 22px;
  background: var(--base); transition: border-color .18s, transform .18s var(--ease);
}
.section.alt .fcard { background: var(--crust); }
.fcard:hover { border-color: var(--surface2); transform: translateY(-3px); }
.fcard .ico { font-family: var(--mono); font-size: 22px; color: var(--accent); margin-bottom: 14px; }
.fcard h3 { font-size: 16.5px; margin-bottom: 9px; }
.fcard p { color: var(--subtext0); font-size: 14.5px; margin: 0; line-height: 1.58; }

/* ---------- differ / philosophy ---------- */
.diff h2 { font-size: clamp(28px, 4.2vw, 44px); max-width: 760px; }
.diff p:not(.eyebrow) { color: var(--subtext1); font-size: 18px; max-width: 720px; margin: 22px 0 0; }
.diff p b { color: var(--text); }
.tagline {
  margin-top: 40px; font-family: var(--mono); font-size: clamp(18px,2.4vw,24px);
  color: var(--text); letter-spacing: -.01em;
}
.tagline .dim { color: var(--overlay1); }

/* ---------- final cta ---------- */
.cta-final { text-align: center; }
.cta-final h2 { font-size: clamp(30px, 4.6vw, 46px); }
.cta-final p { color: var(--subtext0); font-size: 18px; margin: 16px auto 34px; max-width: 520px; }
.install {
  display: inline-flex; align-items: center; gap: 14px;
  background: var(--crust); border: var(--border); border-radius: 12px;
  font-family: var(--mono); font-size: 15px; padding: 14px 18px; margin-bottom: 30px;
}
.install .prompt { color: var(--green); }
.install .cmd { color: var(--text); }
.install button {
  background: var(--surface0); color: var(--subtext1); border: 1px solid var(--surface1);
  font-family: var(--mono); font-size: 12px; border-radius: 7px; padding: 5px 11px; cursor: pointer;
  transition: color .15s, border-color .15s;
}
.install button:hover { color: var(--text); border-color: var(--surface2); }
.install button.copied { color: var(--green); }
.cta-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

/* ---------- footer ---------- */
.foot {
  border-top: 1px solid var(--surface0);
  padding: 40px 0;
  color: var(--overlay0); font-size: 14px;
}
.foot-inner { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.foot-inner .brand { font-size: 16px; margin-right: auto; }
.foot-links { display: flex; gap: 20px; }
.foot-links a { color: var(--subtext0); font-family: var(--mono); font-size: 13px; }
.foot-links a:hover { color: var(--text); }
.foot-copy { width: 100%; margin-top: 24px; font-family: var(--mono); font-size: 12.5px; color: var(--overlay0); }
.foot-copy .greek { color: var(--subtext0); }

/* ---------- scroll reveal (JS-gated; no-JS shows everything) ---------- */
.rise { opacity: 1; transform: none; }
.is-ready .rise { opacity: 0; transform: translateY(18px); transition: opacity .6s var(--ease), transform .6s var(--ease); }
.is-ready .rise.in { opacity: 1; transform: none; }

/* focus */
.kosmo-landing :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }

@media (prefers-reduced-motion: reduce) {
  .is-ready .rise { opacity: 1 !important; transform: none !important; transition: none !important; }
}
</style>
