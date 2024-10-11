import { useEffect, useState, useRef } from "react";
import { nanoid } from "nanoid";
import { Card } from "@/components/ui/card";
import { ControlBar } from "./components/ControlBar";
import { config } from "./config";
import { useHotkeys } from "react-hotkeys-hook";
import { LogList, LogListRef } from "./components/LogList";
import { toast } from "sonner";
import { useQueryParams, StringParam, BooleanParam, withDefault } from "use-query-params";
import { Log } from "@/types";

export function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"active" | "inactive">("active");
  const [filterState, setFilterState] = useQueryParams({
    query: withDefault(StringParam, undefined),
    caseSensitive: withDefault(BooleanParam, undefined),
    after: withDefault(StringParam, undefined),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const logListRef = useRef<LogListRef>(null);

  useEffect(() => {
    const url = new URL(`${config.backendURL}${config.routes.events}`);
    url.searchParams.set("stream", nanoid());
    if (filterState.query) {
      url.searchParams.set("query", filterState.query);
    }
    if (filterState.caseSensitive) {
      url.searchParams.set("caseSensitive", filterState.caseSensitive.toString());
    }
    if (filterState.after) {
      url.searchParams.set("after", filterState.after);
    }
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnectionStatus("active");
    };

    eventSource.onerror = () => {
      setConnectionStatus("inactive");
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const incomingLogs = JSON.parse(event.data) as Log[];
        if (incomingLogs.length !== 1) {
          logListRef.current?.resetVirtualization();
          setLogs(incomingLogs);
        } else {
          setLogs((prevLogs) => [...prevLogs, ...incomingLogs]);
        }
      } catch (error) {
        console.error("Error parsing log", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [filterState]);

  function handleClear() {
    setFilterState((prev) => ({
      ...prev,
      after: logs.at(-1)?.id,
    }));
    setLogs([]);
    logListRef.current?.resetVirtualization();
    toast.success("Logs cleared");
  }

  async function handleRestart() {
    try {
      const response = await fetch(`${config.backendURL}${config.routes.restart}`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Agent restarted");
        setConnectionStatus("active");
      }
    } catch (error) {
      console.error("Error restarting agent:", error);
      setConnectionStatus("inactive");
      toast.error("Failed to restart agent");
    }
  }

  useHotkeys("mod+k", () => {
    handleClear();
  });

  useHotkeys(
    "/",
    () => {
      searchInputRef.current?.focus();
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    }
  );

  useHotkeys(
    "escape",
    () => {
      searchInputRef.current?.blur();
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <div className="bg-slate-50 overflow-hidden">
      <div className="container p-6 h-screen">
        <Card className="relative flex flex-col flex-1">
          <ControlBar
            status={connectionStatus}
            filter={filterState}
            ref={searchInputRef}
            onFilterStateChange={(query) =>
              setFilterState({
                caseSensitive: Boolean(query.caseSensitive) || undefined,
                query: query.query || undefined,
              })
            }
            onClear={handleClear}
            onRestart={handleRestart}
            onScrollToTop={() => logListRef.current?.scrollToTop()}
            onScrollToBottom={() => logListRef.current?.scrollToBottom()}
          />
          <LogList ref={logListRef} logs={logs} />
        </Card>
      </div>
    </div>
  );
}
