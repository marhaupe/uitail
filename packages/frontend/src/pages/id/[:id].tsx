import { LogList, LogListRef } from "@/components/LogList";
import { Button } from "@/components/ui/button";
import { config } from "@/config";
import { Log } from "@/types";
import { useLayoutEffect, useRef } from "react";
import { LoaderFunctionArgs, useLoaderData, useSearchParams } from "react-router-dom";

LogView.loader = async ({ params, request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const around = params.id;
  const beforeCount = url.searchParams.get("beforeCount") || "10";
  const afterCount = url.searchParams.get("afterCount") || "10";
  const response = await fetch(
    `${config.backendURL}${config.routes.logs}?around=${around}&beforeCount=${beforeCount}&afterCount=${afterCount}`
  );
  return {
    id: params.id,
    logs: (await response.json()) as Log[],
  };
};

export function LogView() {
  const logListRef = useRef<LogListRef>(null);
  const [, setSearchParams] = useSearchParams();

  const { id, logs } = useLoaderData() as Awaited<ReturnType<typeof LogView.loader>>;

  useLayoutEffect(() => {
    logListRef.current?.resetVirtualization();
    logListRef.current?.setSelectedLogIndex(logs.findIndex((log) => log.id === id));
  }, [logs, id]);

  function handleIncrementCount(action: "beforeCount" | "afterCount") {
    setSearchParams(
      (prev) => {
        prev.set(action, (parseInt(prev.get(action) || "10") + 10).toString());
        return prev;
      },
      { replace: true }
    );
  }

  return (
    <div className="bg-slate-50 overflow-hidden">
      <div className="md:container md:px-0 h-screen bg-white">
        <div className="flex border-slate-100 border-2 flex-col flex-1 min-h-60">
          <div className="flex flex-row border-b divide-x">
            <Button
              className="flex-1 rounded-none"
              variant="ghost"
              onClick={() => handleIncrementCount("beforeCount")}
            >
              Show more before
            </Button>
            <Button
              className="flex-1 rounded-none"
              variant="ghost"
              onClick={() => handleIncrementCount("afterCount")}
            >
              Show more after
            </Button>
          </div>
          <LogList logs={logs} ref={logListRef} connectionStatus="active" />
        </div>
      </div>
    </div>
  );
}
