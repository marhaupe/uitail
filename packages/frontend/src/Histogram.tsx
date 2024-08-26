import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { format } from "date-fns";
import { Log } from "@/App";
import { useCallback, useEffect, useState } from "react";
import throttle from "lodash.throttle";

type HistogramProps = {
  logs: Log[];
  onTimeframeSelect: (after: Date, before?: Date) => void;
};

type Bucket = {
  startTime: Date;
  count: number;
};

const bucketCount = 100;

export function Histogram({ logs, onTimeframeSelect }: HistogramProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const throttledSetBuckets = useCallback(
    throttle((logs: Log[]) => {
      if (logs.length < bucketCount) {
        setBuckets(
          logs.map((log) => ({
            startTime: new Date(log.timestamp),
            count: 1,
          })),
        );
        return;
      }
      // should set a different unit depending on the timeframe
      const startDate = new Date(logs[0].timestamp).setMilliseconds(0);
      const endDate = new Date(logs[logs.length - 1].timestamp).setMilliseconds(
        0,
      );
      const timeDiff = endDate - startDate;
      // Maybe we can set the interval to either 100 or logs.length
      const bucketInterval = timeDiff / bucketCount;
      const buckets: Bucket[] = [];
      for (let i = 0; i < bucketCount; i++) {
        const bucketLogDate = new Date(startDate + i * bucketInterval);
        const bucketLogs = logs.filter((log) => {
          const logDate = new Date(log.timestamp);
          return (
            logDate >= bucketLogDate &&
            logDate < new Date(bucketLogDate.getTime() + bucketInterval)
          );
        });
        buckets.push({
          startTime: bucketLogDate,
          count: bucketLogs.length,
        });
      }
      setBuckets(buckets);
    }, 2500),
    [setBuckets],
  );

  useEffect(() => throttledSetBuckets(logs), [logs, throttledSetBuckets]);

  const chartConfig = {} satisfies ChartConfig;
  const maxBucketCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div className="flex flex-row justify-center">
      <ChartContainer
        className="aspect-auto h-[125px] w-full"
        config={chartConfig}
      >
        <BarChart
          data={buckets}
          onClick={(e) => {
            const activeBucket = buckets[e.activeTooltipIndex ?? -1];
            const nextBucket = buckets[(e.activeTooltipIndex ?? -1) + 1];
            if (activeBucket) {
              onTimeframeSelect(activeBucket.startTime, nextBucket?.startTime);
            }
          }}
        >
          <XAxis
            dataKey="startTime"
            tickLine={false}
            axisLine={false}
            tickFormatter={(time) => format(time, "HH:mm:ss:SS")}
          />
          <YAxis
            domain={[
              0,
              maxBucketCount > 500
                ? 500
                : maxBucketCount > 250
                  ? 250
                  : maxBucketCount > 100
                    ? 100
                    : 50,
            ]}
          />

          <ChartTooltip
            labelFormatter={(time) => format(new Date(time), "HH:mm:ss:SS")}
            formatter={(value) => [`${value}`, "Count"]}
          />
          <Bar isAnimationActive={false} dataKey="count" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
