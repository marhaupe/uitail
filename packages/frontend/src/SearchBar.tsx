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

type Props = {
  filter: FilterState;
  onFilterStateChange: (filter: FilterState) => void;
};

export type FilterState = {
  message: string;
  caseInsensitive: boolean;
};

export const SearchQueryBuilder = forwardRef(function SearchQueryBuilder(
  { filter, onFilterStateChange }: Props,
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
        <div className="relative w-full">
          <Input
            {...register("message")}
            id="message-input"
            placeholder="Filter ('/')"
          />
          <div className="absolute top-0 right-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Toggle
                    aria-label="Match case"
                    pressed={watch("caseInsensitive")}
                    onPressedChange={(pressed) =>
                      setValue("caseInsensitive", pressed)
                    }
                  >
                    Aa
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Match case</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
});
