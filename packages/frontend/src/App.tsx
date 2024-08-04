import anser from "anser";
import { useEffect, useState, useRef } from "react";

import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import { LucideLoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchQueryBuilder } from "@/SearchBar";
import { Histogram } from "@/Histogram";

const logSchema = Type.Object({
  timestamp: Type.String(),
  message: Type.String(),
});
const logsSchema = Type.Array(logSchema);

export type Log = Static<typeof logSchema>;

export function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = new URL("http://localhost:8788/events");
    url.searchParams.set("stream", nanoid());
    url.searchParams.set("filter", filter);

    console.log(`dev: filter`, filter);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const logs = Value.Decode(logsSchema, JSON.parse(event.data));
        setLogs((prevLogs) => [...prevLogs, ...logs]);
      } catch (error) {
        console.error("error parsing log", error);
      }
    };

    return () => {
      setLogs([]);
      eventSource.close();
    };
  }, [filter]);

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
    <div className="flex  flex-1 flex-col min-h-screen bg-slate-50 p-6">
      {
        <>
          <Card className="mb-4">
            <CardContent className="p-2">
              <Histogram logs={logs} />
            </CardContent>
          </Card>
          <Card className="relative">
            <SearchQueryBuilder
              ref={searchInputRef}
              onSearch={(query) => setFilter(query)}
            />
            {logs.length > 0 ? (
              <CardContent className="overflow-scroll">
                {logs.map((log) => (
                  <div
                    className="flex flex-row text-sm border-none"
                    key={log.timestamp + log.message}
                  >
                    {log.message.trim().length > 0 ? (
                      <LogEntry log={log} />
                    ) : (
                      <div className="h-3" />
                    )}
                  </div>
                ))}
              </CardContent>
            ) : (
              <CardContent>
                <div className="text-center text-slate-500 flex flex-row gap-2">
                  Waiting for logs
                  <LucideLoaderCircle className="animate-spin" />
                </div>
              </CardContent>
            )}
          </Card>
        </>
      }
    </div>
  );
}

function LogEntry({ log }: { log: Log }) {
  const renderLogMessage = (message: string) => {
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
      <div className="w-3 min-w-32 text-slate-400 font-mono text-sm tracking-tighter select-none">
        {new Date(log.timestamp).toISOString().split("T")[1]}
      </div>
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
