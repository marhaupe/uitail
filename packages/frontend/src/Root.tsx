import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import { Outlet } from "react-router-dom";

export function Root() {
  return (
    <QueryParamProvider
      adapter={ReactRouter6Adapter}
      options={{
        removeDefaultsFromUrl: true,
      }}
    >
      <Outlet />
      <Toaster />
    </QueryParamProvider>
  );
}
