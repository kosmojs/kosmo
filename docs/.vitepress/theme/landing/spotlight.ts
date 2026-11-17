import { onBeforeUnmount, onMounted, type Ref } from "vue";

/*
  Pointer spotlight for the landing's .card recipe.

  One listener per section, not per card: on every pointer move the
  pointer position is written into each card's --mx/--my, relative to that
  card. Cards near the pointer light their border and face; cards further
  away stay dark because the gradient has already faded out. Writes are
  batched into one animation frame.

  Coarse pointers (touch) skip the whole thing - there is no hover to
  follow, and a stuck highlight after a tap reads as a bug.
*/
export function useSpotlight(rootEl: Ref<HTMLElement | null>) {
  let frame = 0;
  let x = 0;
  let y = 0;
  let root: HTMLElement | null = null;

  const paint = () => {
    frame = 0;
    if (!root) {
      return;
    }
    for (const card of root.querySelectorAll<HTMLElement>(".card")) {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${x - box.left}px`);
      card.style.setProperty("--my", `${y - box.top}px`);
    }
  };

  const onMove = (event: PointerEvent) => {
    x = event.clientX;
    y = event.clientY;
    if (!frame) {
      frame = requestAnimationFrame(paint);
    }
  };

  onMounted(() => {
    root = rootEl.value;
    if (!root || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    root.addEventListener("pointermove", onMove, { passive: true });
  });

  onBeforeUnmount(() => {
    root?.removeEventListener("pointermove", onMove);
    if (frame) {
      cancelAnimationFrame(frame);
    }
  });
}
