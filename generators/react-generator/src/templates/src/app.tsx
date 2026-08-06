import { Outlet } from "react-router";
import { AppProvider } from "{{ createImport 'lib' 'app' }}";

export default function App() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
