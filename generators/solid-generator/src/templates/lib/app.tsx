import type { ParentComponent } from "solid-js";

export const AppProvider: ParentComponent = (props) => {
  return props.children;
};
