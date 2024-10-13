import { forwardRef, useImperativeHandle, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, RefreshCw, ChevronsUp, ChevronsDown } from "lucide-react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterInput } from "@/components/FilterInput";
import debounce from "lodash.debounce";

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
  query?: string;
  caseSensitive?: boolean;
  regex?: boolean;
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
      query: filter.query,
      caseSensitive: filter.caseSensitive,
      regex: filter.regex,
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => {
      setFocus("query");
    },
    blur: () => {
      document.getElementById("query-input")?.blur();
    },
  }));

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name !== "query") {
        onFilterStateChange({
          [name as keyof FilterState]: value[name as keyof FilterState] || undefined,
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [watch, onFilterStateChange, filter]);

  const debouncedOnFilterStateChange = useMemo(
    () => debounce(onFilterStateChange, 100),
    [onFilterStateChange]
  );

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "query") {
        debouncedOnFilterStateChange({
          query: value.query || undefined,
        });
      }
    });
    return () => {
      subscription.unsubscribe();
      debouncedOnFilterStateChange.cancel();
    };
  }, [watch, onFilterStateChange, debouncedOnFilterStateChange]);

  return (
    <TooltipProvider>
      <div className="sticky rounded-md top-0 p-2 bg-background z-50">
        <div className="flex flex-col items-end md:flex-row md:items-center h-20 md:h-10 text-sm gap-2">
          <FilterInput
            register={register}
            caseSensitive={watch("caseSensitive") ?? false}
            regex={watch("regex") ?? false}
            query={watch("query") ?? ""}
            onCaseSensitiveChange={(pressed) => setValue("caseSensitive", pressed)}
            onRegexChange={(pressed) => setValue("regex", pressed)}
          />
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
