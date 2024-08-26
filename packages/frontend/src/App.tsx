import anser from "anser";
import { useEffect, useState, useRef } from "react";

import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsDown,
  ChevronsUp,
  ClipboardCopyIcon,
  LucideLoaderCircle,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
} from "lucide-react";
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
import { cn } from "./lib/utils";

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
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const logRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        searchInputRef.current?.blur();
      }
      if (["j", "k", "ArrowUp", "ArrowDown"].includes(event.key)) {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement;

        if (!isInputFocused) {
          event.preventDefault();
          setSelectedLogIndex((prevIndex) => {
            if (prevIndex === null) return 0;
            const newIndex =
              event.key === "j" || event.key === "ArrowDown"
                ? Math.min(prevIndex + 1, logs.length - 1)
                : Math.max(prevIndex - 1, 0);
            logRefs.current[newIndex]?.scrollIntoView({
              behavior: "instant",
              block: "nearest",
            });
            return newIndex;
          });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [logs.length]);

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-slate-50 p-6">
      <Card className="mb-4 relative">
        <CardContent className="p-2">
          <Button
            variant="ghost"
            className="p-2 absolute top-2 right-2 z-40"
            onClick={() => setIsPaused((prev) => !prev)}
          >
            {isPaused ? (
              <PlayIcon className="h-6 w-6" />
            ) : (
              <PauseIcon className="h-6 w-6" />
            )}
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
        <div className="flex fixed bottom-4 right-4 flex-row gap-1 z-50">
          <Button
            variant="outline"
            className="p-2"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronsUp />
          </Button>
          <Button
            variant="outline"
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
            {logs.map((log, index) => {
              const isSelected = index === selectedLogIndex;
              return (
                <div
                  className={cn(
                    "flex flex-row text-sm border-none",
                    isSelected && "bg-slate-100",
                  )}
                  key={log.timestamp + log.message}
                  ref={(el) => (logRefs.current[index] = el)}
                >
                  {log.message.trim().length > 0 ? (
                    <LogEntry
                      onSelect={() => setSelectedLogIndex(index)}
                      isSelected={isSelected}
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
              );
            })}
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
  isSelected: boolean;
  onSelect: () => void;
  onSelectFromFilter: () => void;
  onSelectToFilter: () => void;
};

function LogEntry({
  log,
  onSelect,
  isSelected,
  onSelectFromFilter,
  onSelectToFilter,
}: LogEntryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  function renderLogMessage(message: string) {
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
  }

  function onToggleExpand() {
    setCollapsed((prev) => !prev);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(log.message);
  }

  return (
    <div
      onClick={() => onSelect()}
      className={cn(
        "flex w-full group relative min-h-4",
        isHovered && "bg-slate-50",
        isSelected && "bg-slate-100",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0 w-32 text-slate-400 font-mono text-sm tracking-tighter select-none">
        {new Date(log.timestamp).toISOString().split("T")[1]}
      </div>
      <div className="flex-grow whitespace-pre font-mono text-sm tracking-tight overflow-x-auto">
        {renderLogMessage(log.message)}
      </div>
      {(isHovered || isSelected) && (
        <div className="absolute top-0 right-0 h-5 flex flex-row">
          {log.message.split("\n").length > 1 ? (
            <button
              onClick={onToggleExpand}
              className="p-0 m-0 size-5 border border-slate-300 flex items-center justify-center"
            >
              {collapsed ? (
                <PlusIcon className="size-4" />
              ) : (
                <MinusIcon className="size-4" />
              )}
            </button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0 m-0 size-5 border border-slate-300 flex items-center justify-center">
                <MoreHorizontalIcon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onSelectToFilter}>
                Show logs before
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSelectFromFilter}>
                Show logs after
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                Copy to clipboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
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
