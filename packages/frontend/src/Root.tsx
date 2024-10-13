import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import { Outlet, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";

export function Root() {
  const navigate = useNavigate();

  useHotkeys(
    "ctrl+minus",
    () => {
      navigate(-1);
    },
    { preventDefault: true }
  );

  useHotkeys(
    "ctrl+shift+minus",
    () => {
      navigate(1);
    },
    { preventDefault: true }
  );

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
