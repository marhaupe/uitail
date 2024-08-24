import anser from "anser";
import { useEffect, useState, useRef } from "react";

import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import { ChevronsDown, ChevronsUp, LucideLoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FilterState, SearchQueryBuilder } from "@/SearchBar";
import { Histogram } from "@/Histogram";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { config } from "./config";

const logSchema = Type.Object({
  timestamp: Type.String(),
  message: Type.String(),
});
const logsSchema = Type.Array(logSchema);

export type Log = Static<typeof logSchema>;

export function App() {
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    message: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [eventSource, setEventSource] = useState<EventSource>();

  useEffect(() => {
    const url = new URL(config.agentUrl);
    url.searchParams.set("stream", nanoid());
    if (filterState.message.trim().length > 0) {
      url.searchParams.set("filter", filterState.message);
    } else {
      url.searchParams.delete("filter");
    }
    if (filterState.after) {
      url.searchParams.set("after", filterState.after.toISOString());
    } else {
      url.searchParams.delete("after");
    }
    if (filterState.before) {
      url.searchParams.set("before", filterState.before.toISOString());
    } else {
      url.searchParams.delete("before");
    }
    const newEventSource = new EventSource(url);
    setEventSource(newEventSource);
    return () => {
      setLogs([]);
      newEventSource.close();
    };
  }, [filterState]);

  useEffect(() => {
    if (!eventSource) {
      return;
    }
    eventSource.onmessage = (event: MessageEvent) => {
      if (isPaused) {
        return;
      }
      try {
        const logs = Value.Decode(logsSchema, JSON.parse(event.data));
        setLogs((prevLogs) => [...prevLogs, ...logs]);
      } catch (error) {
        console.error("error parsing log", error);
      }
    };
  }, [eventSource, isPaused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement !== searchInputRef.current
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-slate-50 p-6">
      <Card className="mb-4 relative">
        <CardContent className="p-2">
          <Button
            className="p-2 absolute top-2 right-2 z-40"
            onClick={() => setIsPaused((prev) => !prev)}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Histogram
            logs={logs}
            onTimeframeSelect={(after, before) => {
              setFilterState((prev) => ({
                ...prev,
                after,
                before,
              }));
            }}
          />
        </CardContent>
      </Card>
      <Card className="relative flex flex-col flex-1">
        <div className="fixed bottom-4 right-4 flex-row">
          <Button
            className="p-2"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronsUp />
          </Button>
          <Button
            className="p-2"
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              })
            }
          >
            <ChevronsDown />
          </Button>
        </div>
        <SearchQueryBuilder
          filter={filterState}
          ref={searchInputRef}
          onFilterStateChange={(query) => setFilterState(query)}
        />
        {logs.length > 0 ? (
          <CardContent className="overflow-scroll">
            {logs.map((log) => (
              <div
                className="flex flex-row text-sm border-none"
                key={log.timestamp + log.message}
              >
                {log.message.trim().length > 0 ? (
                  <LogEntry
                    onSelectFromFilter={() => {
                      setFilterState((prev) => ({
                        ...prev,
                        after: new Date(log.timestamp),
                        before: undefined,
                      }));
                    }}
                    onSelectToFilter={() => {
                      setFilterState((prev) => ({
                        ...prev,
                        after: undefined,
                        before: new Date(log.timestamp),
                      }));
                    }}
                    log={log}
                  />
                ) : (
                  <div className="h-3" />
                )}
              </div>
            ))}
          </CardContent>
        ) : (
          <CardContent className="text-slate-500 flex flex-row gap-2 flex-1 justify-center items-center h-full">
            Waiting for logs
            <LucideLoaderCircle className="animate-spin" />
          </CardContent>
        )}
      </Card>
    </div>
  );
}

type LogEntryProps = {
  log: Log;
  onSelectFromFilter: () => void;
  onSelectToFilter: () => void;
};

function LogEntry({
  log,
  onSelectFromFilter,
  onSelectToFilter,
}: LogEntryProps) {
  const [collapsed, setCollapsed] = useState(false);

  const renderLogMessage = (message: string) => {
    if (collapsed) {
      const messageLines = message.split("\n");
      message = messageLines
        .slice(0, Math.min(messageLines.length, 3))
        .join("\n");
    }
    return anser
      .ansiToJson(message, { use_classes: true })
      .map((part: anser.AnserJsonEntry, index: number) => (
        <span
          key={index}
          style={{
            color: ANSI_COLOR_MAP[part.fg] || "inherit",
            backgroundColor: ANSI_COLOR_MAP[part.bg] || "inherit",
          }}
        >
          {part.content}
        </span>
      ));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row justify-start w-32 min-w-32 text-slate-400 font-mono text-sm tracking-tighter select-none focus-visible:outline-none hover:underline">
          {new Date(log.timestamp).toISOString().split("T")[1]}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "Expand" : "Collapse"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectToFilter}>
            Show logs before
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectFromFilter}>
            Show logs after
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="whitespace-pre font-mono text-sm tracking-tight">
        {renderLogMessage(log.message)}
      </div>
    </>
  );
}

const ANSI_COLOR_MAP: Record<string, string> = {
  "ansi-black": "#020617",
  "ansi-red": "#DC143C",
  "ansi-green": "#22c55e",
  "ansi-yellow": "#eab308",
  "ansi-blue": "#3b82f6",
  "ansi-magenta": "#ec4899",
  "ansi-cyan": "#6ee7b7",
  "ansi-white": "#f8fafc",
  "ansi-bright-black": "#64748b",
  "ansi-bright-red": "#B22222",
  "ansi-bright-green": "#228B22",
  "ansi-bright-yellow": "#DAA520",
  "ansi-bright-blue": "#191970",
  "ansi-bright-magenta": "#800080",
  "ansi-bright-cyan": "#00688B",
  "ansi-bright-white": "#708090",
};
