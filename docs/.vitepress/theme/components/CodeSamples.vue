<script setup>
import ParamsValidation001 from './ParamsValidation.md'
import PayloadValidation from './PayloadValidation.md'
import ResponseValidation from './ResponseValidation.md'
import ComposableMiddleware from './ComposableMiddleware.md'
import CascadingMiddleware from './CascadingMiddleware.md'
</script>
<template>
  <div class="hero-sections">

    <div class="hero-block">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Validation</h1>
          <div class="hero-description">
            Define types in TypeScript. Get runtime validation, type-safe clients,
            and OpenAPI specs for free. No schema DSLs.
            Just pure TypeScript with superpowers.
            One source of truth, zero maintenance overhead.
          </div>
        </div>
        <a href="/validation/params" class="details-button">Details ➜</a>
      </div>
      <div>
        <ParamsValidation001 />
      </div>
    </div>

    <div class="divider" />

    <div class="hero-block hero-block--reversed">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Payload Validation</h1>
          <div class="hero-description">
            Validation targets provides control over what gets validated.
            <div>
              Body targets:
              <code>json</code> /
              <code>form</code> /
              <code>raw</code>.
            </div>
            <div>
              Metadata targets:
              <code>query</code>,
              <code>headers</code>,
              <code>cookies</code>.
            </div>
            <div class="text-hint">
              Use <code>VRefine</code> to specify JSON Schema constraints.
            </div>
          </div>
        </div>
        <a href="/validation/payload" class="details-button">Details ➜</a>
      </div>
      <div>
        <PayloadValidation />
      </div>
    </div>

    <div class="divider" />

    <div class="hero-block">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Response Validation</h1>
          <div class="hero-description">
            Just as you validate incoming request data, you can validate outgoing response data
            by providing a tuple with status code, content type and expected schema.
            <div class="text-hint">
              Also an union of tuples can be used to specify multiple variants.
            </div>
            <div class="text-hint">
              Enabled by default on dev, disabled in production.
            </div>
          </div>
        </div>
        <a href="/validation/response" class="details-button">Details ➜</a>
      </div>
      <div>
        <ResponseValidation />
      </div>
    </div>

    <div class="divider" />

    <div class="hero-block hero-block--reversed">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Composable Middleware</h1>
          <div class="hero-description">
            Global middleware added to <code>api/use.ts</code> will run on every route.
            Routes can use <code>slot</code> option to override global middleware.
            <div class="text-hint">
              Custom slots like <code>logger</code> should be added to <code>api/env.d.ts</code> file.
            </div>
          </div>
        </div>
        <a href="/backend/middleware" class="details-button">Details ➜</a>
      </div>
      <div>
        <ComposableMiddleware />
      </div>
    </div>

    <div class="divider" />

    <div class="hero-block">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Cascading Middleware</h1>
          <div class="hero-description">
            Create a <code>use.ts</code> file in any folder,
            and its default exported middleware automatically wraps all routes in that folder
            and its subfolders - no imports or manual wiring required.
          </div>
        </div>
        <a href="/backend/cascading-middleware" class="details-button">Details ➜</a>
      </div>
      <div>
        <CascadingMiddleware />
      </div>
    </div>
    <hr />
  </div>
</template>

<style scoped>
.hero-sections {
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Mobile: single column */
.hero-block {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem 0;
}

/* hero-content contains hero-text + button stacked vertically on desktop */
.hero-content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 1rem 0;
  color: var(--vp-c-brand-1, #3451b2);
  white-space: nowrap;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--vp-c-text-2, #476582);
  margin-bottom: 0;
}

.details-button {
  display: inline-block;
  text-decoration: none;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
  flex-shrink: 0;
}

.details-button:hover {
  border-color: var(--vp-button-brand-hover-border);
  color: var(--vp-button-brand-hover-text);
  background-color: var(--vp-button-brand-hover-bg);
}

.text-hint {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: var(--vp-c-text-3, #a0a0a0);
}

.zoom-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-3, #a0a0a0);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.divider {
  height: 1px;
  background: var(--vp-c-divider, #e2e2e3);
  margin: 2rem 0;
}

@media (min-width: 993px) {
  /* Desktop: two columns side by side */
  .hero-block {
    flex-direction: row;
    align-items: flex-start;
    gap: 3rem;
    padding: 3rem 0;
  }

  /* Both direct children share equal width */
  .hero-block > * {
    flex: 1;
    min-width: 0;
  }

  /* hero-content stacks text + button vertically */
  .hero-content {
    flex-direction: column;
    width: auto;
  }

  /* Reversed: push hero-content to the right */
  .hero-block--reversed .hero-content {
    order: 1;
  }

  .hero-description {
    margin-bottom: 1.5rem;
  }
}
</style>
