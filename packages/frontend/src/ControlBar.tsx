import { Input } from "@/components/ui/input";
import { forwardRef, useImperativeHandle, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, ChevronsUp, ChevronsDown } from "lucide-react";

type Props = {
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

  const debouncedFilterChange = useCallback(
    debounce((value: { message: string; caseInsensitive: boolean }) => {
      onFilterStateChange({
        ...filter,
        ...value,
      });
    }, 200),
    [filter, onFilterStateChange]
  );

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Toggle
                      aria-label="Match case"
                      pressed={watch("caseInsensitive")}
                      onPressedChange={(pressed) =>
                        setValue("caseInsensitive", pressed)
                      }
                    >
                      Aa
                    </Toggle>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Match case</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={onScrollToTop}>
            <ChevronsUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onScrollToBottom}>
            <ChevronsDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="w-4 h-4 mr-1" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRestart}>
            <RefreshCw className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>
    </div>
  );
});
