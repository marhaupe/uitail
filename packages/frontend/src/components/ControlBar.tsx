import { Input } from "@/components/ui/input";
import { forwardRef, useImperativeHandle, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, RefreshCw, ChevronsUp, ChevronsDown } from "lucide-react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  status: "active" | "inactive";
  filter: FilterState;
  onFilterStateChange: (filter: FilterState) => void;
  onClear: () => void;
  onRestart: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
};

export type FilterState = {
  message?: string;
  caseInsensitive?: boolean;
};

export const ControlBar = forwardRef(function ControlBar(
  {
    status,
    filter,
    onFilterStateChange,
    onClear,
    onRestart,
    onScrollToTop,
    onScrollToBottom,
  }: Props,
  ref
) {
  const { register, watch, setFocus, setValue } = useForm({
    defaultValues: {
      message: filter.message,
      caseInsensitive: filter.caseInsensitive,
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => {
      setFocus("message");
    },
    blur: () => {
      document.getElementById("message-input")?.blur();
    },
  }));

  const debouncedFilterChange = useMemo(() => {
    return debounce((value: { message: string; caseInsensitive: boolean }) => {
      onFilterStateChange({
        ...filter,
        ...value,
      });
    }, 200);
  }, [filter, onFilterStateChange]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "message" || name === "caseInsensitive") {
        debouncedFilterChange({
          message: value.message as string,
          caseInsensitive: value.caseInsensitive as boolean,
        });
      }
    });
    return () => {
      subscription.unsubscribe();
      debouncedFilterChange.cancel();
    };
  }, [watch, debouncedFilterChange]);

  return (
    <TooltipProvider>
      <div className="sticky rounded-md top-0 p-2 bg-background z-50">
        <div className="flex flex-row items-center justify-between h-10 text-sm gap-2">
          <div className="relative flex-grow">
            <Input
              {...register("message")}
              id="message-input"
              placeholder="Filter ('/')"
              className="font-mono text-xs"
            />
            <div className="absolute top-0 right-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Toggle
                      aria-label="Match case"
                      pressed={watch("caseInsensitive")}
                      onPressedChange={(pressed) => setValue("caseInsensitive", pressed)}
                    >
                      Aa
                    </Toggle>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Match case</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onScrollToTop}>
                  <ChevronsUp className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Scroll to top <span className="text-muted-foreground">(g)</span>
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onScrollToBottom}>
                  <ChevronsDown className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Scroll to bottom <span className="text-muted-foreground">(G)</span>
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Clear logs <span className="text-muted-foreground">(⌘+K)</span>
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onRestart}>
                  <RefreshCw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restart agent</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Circle
                    className={cn(
                      "size-2 animate-pulse",
                      status === "active"
                        ? "fill-green-500 text-green-500"
                        : "fill-red-500 text-red-500"
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status === "active" ? "Agent running" : "Agent disconnected"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});
