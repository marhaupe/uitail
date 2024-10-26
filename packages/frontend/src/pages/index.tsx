import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Card } from "@/components/ui/card";
import { ControlBar, FilterState } from "../components/ControlBar";
import { config } from "../config";
import { useHotkeys } from "react-hotkeys-hook";
import { LogList, LogListRef } from "../components/LogList";
import { toast } from "sonner";
import { useQueryParams, StringParam, BooleanParam, withDefault } from "use-query-params";
import { Log } from "@/types";

export function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"active" | "inactive">("active");
  const [filterState, setFilterState] = useQueryParams({
    query: withDefault(StringParam, undefined),
    caseSensitive: withDefault(BooleanParam, undefined),
    regex: withDefault(BooleanParam, undefined),
    after: withDefault(StringParam, undefined),
  });

  const logListRef = useRef<LogListRef>(null);

  useLayoutEffect(() => {
    if (config.command) {
      document.title = `uitail | ${config.command}`;
    }
  }, []);

  useEffect(() => {
    const url = new URL(`${config.backendURL}${config.routes.events}`);
    url.searchParams.set("stream", nanoid());
    if (filterState.query) {
      url.searchParams.set("query", filterState.query);
    }
    if (filterState.caseSensitive) {
      url.searchParams.set("caseSensitive", filterState.caseSensitive.toString());
    }
    if (filterState.regex) {
      url.searchParams.set("regex", filterState.regex.toString());
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
      const incomingLogs = safeParseLogs(event.data);
      logListRef.current?.resetVirtualization();
      setLogs(incomingLogs);
      eventSource.onmessage = (event: MessageEvent) => {
        const incomingLogs = safeParseLogs(event.data);
        setLogs((prevLogs) => [...prevLogs, ...incomingLogs]);
      };
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
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast.success("Agent restarted");
      setConnectionStatus("active");
    } catch (error) {
      setConnectionStatus("inactive");
      toast.error("Failed to restart agent");
    }
  }

  useHotkeys(
    "mod+k",
    () => {
      handleClear();
    },
    {
      enableOnFormTags: true,
    }
  );

  const handleFilterStateChange = useCallback(
    (query: FilterState) => {
      setFilterState((prev) => ({
        ...prev,
        ...query,
      }));
    },
    [setFilterState]
  );

  return (
    <div className="bg-slate-50 overflow-hidden">
      <div className="md:container md:p-6 h-screen">
        <Card className="relative flex flex-col flex-1 min-h-60">
          <ControlBar
            status={connectionStatus}
            filter={filterState}
            onFilterStateChange={handleFilterStateChange}
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

function safeParseLogs(data: string) {
  try {
    return JSON.parse(data) as Log[];
  } catch (error) {
    console.error("Error parsing log", error);
    return [];
  }
}
