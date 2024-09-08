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
  const [filterState, setFilterState] = useQueryParams({
    message: withDefault(StringParam, undefined),
    caseInsensitive: withDefault(BooleanParam, undefined),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const logListRef = useRef<LogListRef>(null);

  async function handleClear() {
    try {
      const response = await fetch(`${config.backendUrl}${config.routes.clear}`, {
        method: "POST",
      });
      if (response.ok) {
        setLogs([]);
        toast.success("Logs cleared");
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  }

  async function handleRestart() {
    try {
      const response = await fetch(`${config.backendUrl}${config.routes.restart}`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Agent restarted");
      }
    } catch (error) {
      console.error("Error restarting agent:", error);
    }
  }

  useEffect(() => {
    const url = new URL(config.backendUrl + config.routes.events);
    url.searchParams.set("stream", nanoid());
    if (filterState.message) {
      url.searchParams.set("filter", filterState.message);
    }
    if (filterState.caseInsensitive) {
      url.searchParams.set("caseInsensitive", filterState.caseInsensitive.toString());
    }
    const eventSource = new EventSource(url);
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const incomingLogs = JSON.parse(event.data);
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
    <div className="flex flex-1 flex-col min-h-screen bg-slate-50">
      <div className="container p-6">
        <Card className="relative flex flex-col flex-1">
          <ControlBar
            filter={filterState}
            ref={searchInputRef}
            onFilterStateChange={(query) => setFilterState(query)}
            onClear={handleClear}
            onRestart={handleRestart}
            onScrollToTop={() => logListRef.current?.scrollToTop()}
            onScrollToBottom={() => logListRef.current?.scrollToBottom()}
          />
          <div className="h-2" />
          <LogList ref={logListRef} logs={logs} />
        </Card>
      </div>
    </div>
  );
}
