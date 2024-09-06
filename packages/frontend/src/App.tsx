import { useEffect, useState, useRef } from "react";
import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FilterState, SearchQueryBuilder } from "@/SearchBar";
import { Histogram } from "@/Histogram";
import { Button } from "@/components/ui/button";
import { config } from "./config";
import { useHotkeys } from "react-hotkeys-hook";
import { LogList } from "./components/LogList";

const logSchema = Type.Object({
  timestamp: Type.String(),
  message: Type.String(),
});
const logsSchema = Type.Array(logSchema);

export type Log = Static<typeof logSchema>;

export function App() {
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
      try {
        const logs = Value.Decode(logsSchema, JSON.parse(event.data));
        setLogs((prevLogs) => [...prevLogs, ...logs]);
      } catch (error) {
        console.error("error parsing log", error);
      }
    };
  }, [eventSource]);

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
        <Card className="mb-4 relative">
          <CardContent className="p-2">
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
          <LogList logs={logs} />
        </Card>
      </div>
    </div>
  );
}
