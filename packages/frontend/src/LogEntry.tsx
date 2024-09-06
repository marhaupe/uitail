import { useState, useRef } from "react";
import { Log } from "./App";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { cn } from "./lib/utils";
import anser from "anser";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";

type LogEntryProps = {
  log: Log;
  isDropdownOpen: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDropdownOpenChange: (isOpen: boolean) => void;
};

export function LogEntry({
  log,
  onSelect,
  isSelected,
  onDropdownOpenChange,
  isDropdownOpen,
}: LogEntryProps) {
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
    },
    [selectedMenuItem]
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
    },
    [selectedMenuItem]
  );

  function renderLogMessage(message: string) {
    return anser
      .ansiToJson(message, { use_classes: true })
      .map((part: anser.AnserJsonEntry, index: number) => (
        <span
          key={index}
          // This should stay stable to keep the line height consistent
          className="inline-block h-5 leading-5"
          style={{
            color: ANSI_COLOR_MAP[part.fg] || "inherit",
            backgroundColor: ANSI_COLOR_MAP[part.bg] || "inherit",
          }}
        >
          {part.content}
        </span>
      ));
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(log.message);
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex w-full group relative h-full items-start text-slate-900 font-mono text-sm tracking-tight px-2",
        (isHovered || isSelected) && "bg-slate-100",
        isSelected && "border-l-4 border-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-shrink-0 w-32">
        {new Date(log.timestamp).toISOString().split("T")[1]}
      </div>
      <div className="flex-grow whitespace-pre overflow-x-auto flex-col">
        {renderLogMessage(log.message)}
      </div>
      <div
        className={cn(
          "top-0 right-2 h-5 flex flex-row absolute",
          !(isHovered || isSelected) && "invisible"
        )}
      >
        {/* TODO: Add expand/collapse button that works with virtualizations */}
        {/* {log.message.split("\n").length > 1 ? (
          <Button
            onClick={onToggleExpand}
            variant="outline"
            className="p-0 m-0 size-5"
          >
            {collapsed ? (
              <PlusIcon className="size-4" />
            ) : (
              <MinusIcon className="size-4" />
            )}
          </Button>
        ) : null} */}

        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={handleDropdownOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="p-0 m-0 size-5"
              onPointerDown={() => {
                handleDropdownOpenChange(!isDropdownOpen);
                onSelect();
              }}
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[0] = el)}
              onClick={copyToClipboard}
              className={cn(selectedMenuItem === 0 && "bg-slate-100")}
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
