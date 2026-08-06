import type { ParentComponent } from "solid-js";
import { AppProvider } from "{{ createImport 'lib' 'app' }}";

const App: ParentComponent = (props) => {
  return <AppProvider>{props.children}</AppProvider>;
};

export default App;
