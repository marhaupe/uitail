import anser from "anser";
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
import { useSearchParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { LucideLoaderCircle } from "lucide-react";
import { SearchQueryBuilder } from "@/SearchBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const logSchema = Type.Object({
  timestamp: Type.String(),
  message: Type.String(),
});
const logsSchema = Type.Array(logSchema);

type Log = Static<typeof logSchema>;

export function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchParams, setSearchParams] = useSearchParams({
    filter: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = new URL("http://localhost:8788/events");
    url.searchParams.set("stream", nanoid());
    url.searchParams.set("filter", searchParams.get("filter") || "");

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
  }, [searchParams]);

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

  const renderLogMessage = (message: string) => {
    const parsed = anser.ansiToJson(message, { use_classes: true });
    return parsed.map((part: anser.AnserJsonEntry, index: number) => (
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filter = e.target.value;
    if (filter) {
      setSearchParams({ filter });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="flex  flex-1 flex-col min-h-screen bg-slate-50 p-6">
      {logs.length > 0 ? (
        <>
          <Card className="mb-4">
            <CardContent className="p-2">
              <Histogram logs={logs} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4 px-2">
              <SearchQueryBuilder
                initialQuery={""}
                filterKeys={{}}
                getTagValues={function (
                  filterKey: string,
                  query: string
                ): Promise<string[]> {
                  throw new Error("Function not implemented.");
                }}
                searchSource={""}
              />
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      className="text-sm"
                      key={log.timestamp + log.message}
                    >
                      <TableCell className="w-32 text-slate-500 font-mono text-xs p-2">
                        {new Date(log.timestamp).toISOString().split("T")[1]}
                      </TableCell>
                      <TableCell className="p-2">
                        {renderLogMessage(log.message)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="flex flex-col items-center justify-center h-full">
          <div className="text-center text-slate-500 flex flex-row gap-2">
            Waiting for logs
            <LucideLoaderCircle className="animate-spin" />
          </div>
        </Card>
      )}
    </div>
  );
}

const ANSI_COLOR_MAP: Record<string, string> = {
  "ansi-black": "rgb(40, 40, 40)",
  "ansi-red": "rgb(220, 20, 60)",
  "ansi-green": "rgb(0, 128, 0)",
  "ansi-yellow": "rgb(184, 134, 11)",
  "ansi-blue": "rgb(0, 0, 205)",
  "ansi-magenta": "rgb(139, 0, 139)",
  "ansi-cyan": "rgb(0, 139, 139)",
  "ansi-white": "rgb(169, 169, 169)",
  "ansi-bright-black": "rgb(105, 105, 105)",
  "ansi-bright-red": "rgb(178, 34, 34)",
  "ansi-bright-green": "rgb(34, 139, 34)",
  "ansi-bright-yellow": "rgb(218, 165, 32)",
  "ansi-bright-blue": "rgb(25, 25, 112)",
  "ansi-bright-magenta": "rgb(128, 0, 128)",
  "ansi-bright-cyan": "rgb(0, 104, 139)",
  "ansi-bright-white": "rgb(112, 128, 144)",
};

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

  if (buckets.length === 0) {
    return null;
  }

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
            tickLine={false}
            axisLine={false}
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
