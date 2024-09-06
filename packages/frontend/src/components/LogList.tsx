import { useRef, useState, useEffect, useMemo, memo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { LogEntry } from "../LogEntry";
import { Log } from "../App";
import { CardContent } from "./ui/card";
import { LucideLoaderCircle } from "lucide-react";
import { VariableSizeList as List, areEqual } from "react-window";

interface LogListProps {
  logs: Log[];
}

const REM_IN_PX = 4;
const LINE_HEIGHT = 5 * REM_IN_PX;

export function LogList({ logs }: LogListProps) {
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );
  const listRef = useRef<List>(null);
  const [listHeight, setListHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const { top } = containerRef.current.getBoundingClientRect();
        setListHeight(window.innerHeight - top);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const getItemSize = (index: number) => {
    const lineCount = logs[index].message.split("\n").length;
    return lineCount * LINE_HEIGHT;
  };

  useHotkeys(
    "g,shift+g",
    ({ key }) => {
      const newIndex = key === "g" ? 0 : logs.length - 1;
      listRef.current?.scrollToItem(newIndex, "start");
      setSelectedLogIndex(newIndex);
    },
    { enabled: openDropdownIndex === null }
  );

  useHotkeys(
    "j,k",
    ({ key }) => {
      setSelectedLogIndex((prevIndex) => {
        if (prevIndex === null) return 0;
        const newIndex =
          key === "j" || key === "ArrowDown"
            ? Math.min(prevIndex + 1, logs.length - 1)
            : Math.max(prevIndex - 1, 0);
        listRef.current?.scrollToItem(newIndex, "start");
        return newIndex;
      });
    },
    {
      enabled: openDropdownIndex === null,
    }
  );

  const itemData = useMemo(
    (): RowData => ({
      logs,
      selectedLogIndex,
      openDropdownIndex,
      onSelect: (index: number) => setSelectedLogIndex(index),
      onDropdownOpenChange: (isOpen: boolean, index: number) => {
        if (isOpen) {
          setOpenDropdownIndex(index);
        } else {
          setOpenDropdownIndex(null);
        }
      },
    }),
    [logs, selectedLogIndex, openDropdownIndex]
  );

  return (
    <div ref={containerRef} style={{ height: "100%" }}>
      {logs.length > 0 ? (
        <List
          ref={listRef}
          height={listHeight}
          itemCount={logs.length}
          itemSize={getItemSize}
          itemData={itemData}
          width="100%"
        >
          {Row}
        </List>
      ) : (
        <CardContent className="text-slate-500 flex flex-row gap-2 flex-1 justify-center items-center h-full">
          Waiting for logs
          <LucideLoaderCircle className="animate-spin" />
        </CardContent>
      )}
    </div>
  );
}

interface RowData {
  logs: Log[];
  selectedLogIndex: number | null;
  openDropdownIndex: number | null;
  onSelect: (index: number) => void;
  onDropdownOpenChange: (isOpen: boolean, index: number) => void;
}

const Row = memo(
  ({
    data,
    index,
    style,
  }: {
    data: RowData;
    index: number;
    style: React.CSSProperties;
  }) => {
    const {
      logs,
      selectedLogIndex,
      openDropdownIndex,
      onSelect,
      onDropdownOpenChange,
    } = data;
    const log = logs[index];
    const isSelected = index === selectedLogIndex;
    const isDropdownOpen = index === openDropdownIndex;

    return (
      <div style={style}>
        <LogEntry
          log={log}
          isSelected={isSelected}
          isDropdownOpen={isDropdownOpen}
          onSelect={() => onSelect(index)}
          onDropdownOpenChange={(isOpen) => onDropdownOpenChange(isOpen, index)}
        />
      </div>
    );
  },
  areEqual
);
