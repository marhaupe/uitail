import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CopyIcon, LinkIcon, MoreHorizontalIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Log } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface LogEntryProps {
  log: Log;
  isDropdownOpen: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDropdownOpenChange: (isOpen: boolean) => void;
}

export function LogEntry({
  log,
  onSelect,
  isSelected,
  onDropdownOpenChange,
  isDropdownOpen,
}: LogEntryProps) {
  const router = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number>(0);
  const menuItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  function handleDropdownOpenChange(isOpen: boolean) {
    setSelectedMenuItem(0);
    onDropdownOpenChange(isOpen);
  }

  useHotkeys(
    "l,ArrowRight",
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
        key === "j" || key === "ArrowDown" ? selectedMenuItem + 1 : selectedMenuItem - 1;
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

  function copyToClipboard() {
    navigator.clipboard.writeText(log.message);
    toast.success("Copied to clipboard");
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex w-full group relative h-full items-start text-slate-900 font-mono text-sm tracking-tight px-4 gap-10 border-l-2",
        (isHovered || isSelected) && "bg-slate-100",
        isSelected ? "border-primary" : "border-transparent"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-md:hidden flex-shrink-0 text-slate-400">
        {new Date(log.timestamp).toISOString().split("T")[1]}
      </div>
      <div
        className="flex-grow whitespace-pre overflow-x-visible flex-col min-h-5 leading-5"
        style={{ scrollbarWidth: "none" }}
      >
        {log.message}
      </div>
      <div
        className={cn(
          "top-0 right-2 h-5 flex flex-row absolute",
          !(isHovered || isSelected) && "invisible"
        )}
      >
        <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 pl-2 m-0 h-5 bg-slate-100"
              onPointerDown={() => {
                handleDropdownOpenChange(!isDropdownOpen);
                onSelect();
              }}
            >
              <MoreHorizontalIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[0] = el)}
              onClick={copyToClipboard}
              className={cn("flex gap-2", selectedMenuItem === 0 && "bg-slate-100")}
            >
              <CopyIcon className="size-4" />
              Copy message
            </DropdownMenuItem>
            <DropdownMenuItem
              ref={(el) => (menuItemRefs.current[1] = el)}
              onClick={() => {
                router(`/logs/${log.id}`);
              }}
              className={cn("flex gap-2", selectedMenuItem === 1 && "bg-slate-100")}
            >
              <LinkIcon className="size-4" />
              Show surrounding logs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
