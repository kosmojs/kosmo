import { onMounted, ref } from "vue";

/*
  Scroll reveal, shared by every landing section.

  The gate is deliberate: `.rise` elements are visible by default and only get
  hidden once `ready` flips on mount. Without JS - or with reduced motion -
  nothing ever hides, so the page reads fine either way.

  Each section observes its own subtree, so sections stay independent and can
  be reordered in index.md without touching anything here.
*/
export function useReveal() {
  const rootEl = ref<HTMLElement | null>(null);
  const ready = ref(false);

  onMounted(() => {
    const root = rootEl.value;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ready.value = true;

    const rises = root.querySelectorAll<HTMLElement>(".rise");

    if (!("IntersectionObserver" in window)) {
      rises.forEach((el) => {
        el.classList.add("in");
      });
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

    rises.forEach((el) => {
      io.observe(el);
    });
  });

  return { rootEl, ready };
}
