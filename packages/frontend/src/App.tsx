import { useEffect, useState, useMemo, useRef } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { format, differenceInSeconds, addSeconds } from "date-fns";
import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { nanoid } from "nanoid";
import { LucideLoaderCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SearchQueryBuilder } from "@/SearchBar";

const logSchema = Type.Object({
  timestamp: Type.String(),
  message: Type.String(),
});
const logsSchema = Type.Array(logSchema);

type Log = Static<typeof logSchema>;

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
          <Card>
            <CardHeader className="py-4 px-2">
              <SearchQueryBuilder
                ref={searchInputRef}
                onSearch={(query) => setFilter(query)}
              />
            </CardHeader>
            {logs.length > 0 ? (
              <CardContent>
                {logs.map((log) => (
                  // TODO: Make this a canvas vs a line by line thing. We e.g. want to make copying logs easier, the date musnt' interfere
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
  return (
    <>
      <div className="w-32 text-slate-400 font-mono text-sm tracking-tighter select-none">
        {new Date(log.timestamp).toISOString().split("T")[1]}
      </div>
      <div className="whitespace-pre font-mono text-sm tracking-tight">
        {log.message}
      </div>
    </>
  );
}

type HistogramProps = {
  logs: Log[];
};

function Histogram({ logs }: HistogramProps) {
  const { buckets, chunkSize } = useMemo(() => {
    if (logs.length === 0) {
      return { buckets: [], chunkSize: 10 };
    }

    const oldestLog = new Date(
      Math.min(...logs.map((log) => new Date(log.timestamp).getTime()))
    );
    const newestLog = new Date(
      Math.max(...logs.map((log) => new Date(log.timestamp).getTime()))
    );
    const timeRange = differenceInSeconds(newestLog, oldestLog);

    const numberOfBuckets = 50;
    const chunkSize = Math.max(10, Math.ceil(timeRange / numberOfBuckets));

    const buckets = Array.from({ length: numberOfBuckets }, (_, i) => ({
      time: addSeconds(oldestLog, i * chunkSize),
      count: 0,
    }));

    logs.forEach((log) => {
      const logTime = new Date(log.timestamp);
      const bucketIndex = Math.min(
        Math.floor(differenceInSeconds(logTime, oldestLog) / chunkSize),
        numberOfBuckets - 1
      );
      buckets[bucketIndex].count++;
    });

    return { buckets, chunkSize };
  }, [logs]);

  const chartConfig = {} satisfies ChartConfig;

  return (
    <div className="flex flex-row justify-center">
      <ChartContainer
        className="aspect-auto h-[125px] w-full"
        config={chartConfig}
      >
        <BarChart data={buckets}>
          <XAxis
            dataKey="time"
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(time) =>
              format(time, chunkSize < 60 ? "HH:mm:ss" : "HH:mm")
            }
          />

          <ChartTooltip
            labelFormatter={(time) => format(new Date(time), "HH:mm:ss")}
            formatter={(value) => [`${value} logs`, "Count"]}
          />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
