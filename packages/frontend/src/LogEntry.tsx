import { useState, useRef } from "react";
import { Log } from "./App";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, MinusIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "./lib/utils";
import anser from "anser";
import { useHotkeys } from "react-hotkeys-hook";

type LogEntryProps = {
  log: Log;
  isDropdownOpen: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDropdownOpenChange: (isOpen: boolean) => void;
  onSelectFromFilter: () => void;
  onSelectToFilter: () => void;
};

export function LogEntry({
  log,
  onSelect,
  isSelected,
  onSelectFromFilter,
  onSelectToFilter,
  onDropdownOpenChange,
  isDropdownOpen,
}: LogEntryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number>(0);
  const menuItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDropdownOpenChange = (isOpen: boolean) => {
    setSelectedMenuItem(0);
    onDropdownOpenChange(isOpen);
  };

  useHotkeys(
    "l",
    () => {
      const menuItem = menuItemRefs.current[selectedMenuItem];
      if (isDropdownOpen && menuItem) {
        handleDropdownOpenChange(false);
        menuItem.click();
      } else {
        handleDropdownOpenChange(true);
      }
    },
    {
      enabled: isSelected,
    }
  );

  useHotkeys(
    "j,k,ArrowDown,ArrowUp",
    ({ key }) => {
      let nextSelectedMenuItem =
        key === "j" || key === "ArrowDown"
          ? selectedMenuItem + 1
          : selectedMenuItem - 1;
      nextSelectedMenuItem = Math.max(
        0,
        Math.min(nextSelectedMenuItem, menuItemRefs.current.length - 1)
      );
      setSelectedMenuItem(nextSelectedMenuItem);
      menuItemRefs.current[nextSelectedMenuItem]?.focus();
    },
    {
      enabled: isDropdownOpen,
    }
  );

  useHotkeys("space", () => setCollapsed((prev) => !prev), {
    enabled: isSelected,
  });

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
      onClick={onSelect}
      className={cn(
        "flex w-full group relative min-h-4",
        isHovered && "bg-slate-50",
        isSelected && "bg-slate-100"
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
      <div
        className={cn(
          "top-0 right-0 h-5 flex flex-row absolute",
          !(isHovered || isSelected) && "invisible"
        )}
      >
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

        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={handleDropdownOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <button
              className="p-0 m-0 size-5 border border-slate-300 flex items-center justify-center"
              onPointerDown={() => {
                handleDropdownOpenChange(!isDropdownOpen);
                onSelect();
              }}
            >
              <MoreHorizontalIcon className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[0] = el)}
              onClick={onSelectToFilter}
              className={cn(selectedMenuItem === 0 && "bg-slate-100")}
            >
              Show logs before
            </DropdownMenuItem>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[1] = el)}
              onClick={onSelectFromFilter}
              className={cn(selectedMenuItem === 1 && "bg-slate-100")}
            >
              Show logs after
            </DropdownMenuItem>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[2] = el)}
              onClick={copyToClipboard}
              className={cn(selectedMenuItem === 2 && "bg-slate-100")}
            >
              Copy message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
