import { Bar, BarChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { format, differenceInSeconds } from "date-fns";
import { Log } from "@/App";
import { useMemo } from "react";

type HistogramProps = {
  logs: Log[];
};

export function Histogram({ logs }: HistogramProps) {
  const buckets = useMemo(() => {
    if (logs.length === 0) {
      return [];
    }
    const timeDiff = differenceInSeconds(
      new Date(logs[logs.length - 1].timestamp),
      new Date(logs[0].timestamp)
    );

    function isInBucketTimeframe(logDate: Date, bucketDate: Date) {
      if (timeDiff > 60 * 15) {
        return differenceInSeconds(logDate, bucketDate) < 60;
      }
      if (timeDiff > 60 * 5) {
        return differenceInSeconds(logDate, bucketDate) < 30;
      }
      if (timeDiff > 60) {
        return differenceInSeconds(logDate, bucketDate) < 10;
      }
      return differenceInSeconds(logDate, bucketDate) < 2;
    }

    const buckets: Array<{ time: Date; count: number }> = [];
    for (const log of logs) {
      const bucket = buckets[buckets.length - 1];
      if (bucket && isInBucketTimeframe(new Date(log.timestamp), bucket.time)) {
        bucket.count++;
      } else {
        buckets.push({
          count: 1,
          time: new Date(log.timestamp),
        });
      }
    }
    return buckets;
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
            tickFormatter={(time) => format(time, "HH:mm:ss")}
          />

          <ChartTooltip
            labelFormatter={(time) => format(new Date(time), "HH:mm:ss")}
            formatter={(value) => [`${value}`, "Count"]}
          />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
