import "./index.css";
import { App } from "@/App";
import { Toaster } from "@/components/ui/sonner";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

export function Root() {
  return (
    <QueryParamProvider
      adapter={ReactRouter6Adapter}
      options={{
        removeDefaultsFromUrl: true,
      }}
    >
      <App />
      <Toaster />
    </QueryParamProvider>
  );
}
