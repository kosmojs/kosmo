<script setup lang="ts">
defineProps<{
  href: string;
}>();
</script>

<template>
  <a :href="href" class="kx-button">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0 0h24v24H0z" fill="none"></path>
      <path
        d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12zm6.96 9H7.66l6.552-18h2.128L9.788 21z"
        fill="currentColor"
      ></path>
    </svg>
    <span><slot /></span>
    <span class="arr">-&gt;</span>
  </a>
</template>

<style scoped>
/* Same primary button the landing page uses, so a CTA reads the same anywhere. */
.kx-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 13px 20px;
  background: var(--kx-accent);
  color: var(--kx-bg-inset);
  font-family: var(--kx-font-mono);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--kx-accent-line), 0 14px 34px -16px var(--kx-accent-line);
  transition: background 0.15s, transform 0.15s var(--kx-ease);
}

.kx-button:hover {
  background: var(--kx-accent-hi);
  color: var(--kx-bg-inset);
}

.kx-button:active {
  transform: translateY(1px);
}

.kx-button svg {
  width: 1.15em;
  height: 1.15em;
  flex: none;
}

.kx-button .arr {
  transition: transform 0.2s var(--kx-ease);
}

.kx-button:hover .arr {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .kx-button,
  .kx-button .arr {
    transition: none;
  }
}
</style>
