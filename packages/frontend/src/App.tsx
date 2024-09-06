import { useEffect, useState, useRef } from "react";

import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import {
  ChevronsDown,
  ChevronsUp,
  LucideLoaderCircle,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FilterState, SearchQueryBuilder } from "@/SearchBar";
import { Histogram } from "@/Histogram";
import { Button } from "@/components/ui/button";
import { config } from "./config";
import { cn } from "./lib/utils";
import { LogEntry } from "./LogEntry";
import { useHotkeys } from "react-hotkeys-hook";

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
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );
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
    setSelectedLogIndex(null);
    setEventSource(newEventSource);
    return () => {
      setSelectedLogIndex(null);
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

  useHotkeys(
    "j,k",
    ({ key }) => {
      setSelectedLogIndex((prevIndex) => {
        if (prevIndex === null) return 0;
        const newIndex =
          key === "j" || key === "ArrowDown"
            ? Math.min(prevIndex + 1, logs.length - 1)
            : Math.max(prevIndex - 1, 0);
        logRefs.current[newIndex]?.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
        return newIndex;
      });
    },
    {
      enabled: openDropdownIndex === null,
    }
  );

  useHotkeys(
    "/",
    () => {
      searchInputRef.current?.focus();
    },
    {
      enableOnFormTags: true,
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
              const isDropdownOpen = index === openDropdownIndex;
              return (
                <div
                  className={cn(
                    "flex flex-row text-sm border-none",
                    isSelected && "bg-slate-100"
                  )}
                  key={log.timestamp + log.message}
                  ref={(el) => (logRefs.current[index] = el)}
                >
                  {log.message.trim().length > 0 ? (
                    <LogEntry
                      onSelect={() => setSelectedLogIndex(index)}
                      onDropdownOpenChange={(isOpen) => {
                        if (isOpen) {
                          setOpenDropdownIndex(index);
                        } else {
                          setOpenDropdownIndex(null);
                        }
                      }}
                      isSelected={isSelected}
                      isDropdownOpen={isDropdownOpen}
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
