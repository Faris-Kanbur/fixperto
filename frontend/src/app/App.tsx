import { AppProvider } from "./state/AppLogicProvider";
import { AppShell } from "./AppShell";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
