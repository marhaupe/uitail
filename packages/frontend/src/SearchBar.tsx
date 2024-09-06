import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";
import { forwardRef, useImperativeHandle, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";

type Props = {
  filter: FilterState;
  onFilterStateChange: (filter: FilterState) => void;
};

export type FilterState = {
  after?: Date;
  before?: Date;
  message: string;
};

export const SearchQueryBuilder = forwardRef(function SearchQueryBuilder(
  { filter, onFilterStateChange }: Props,
  ref
) {
  const { register, watch, setFocus } = useForm({
    defaultValues: { message: filter.message },
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
    debounce((value: string) => {
      onFilterStateChange({
        ...filter,
        message: value,
      });
    }, 200),
    [filter, onFilterStateChange]
  );

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "message") {
        debouncedFilterChange(value.message as string);
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
        <Input
          {...register("message")}
          id="message-input"
          placeholder="Filter ('/')"
        />
      </div>
      {(filter.after || filter.before) && (
        <Badge
          onClick={() => {
            onFilterStateChange({
              ...filter,
              after: undefined,
              before: undefined,
            });
          }}
          variant="outline"
          className="cursor-pointer text-xs text-slate-500 m-2"
        >
          From {filter.after?.toISOString().split("T")[1] ?? "start"} to{" "}
          {filter.before?.toISOString().split("T")[1] ?? "now"}
          <XIcon className="size-3 ml-1" />
        </Badge>
      )}
    </div>
  );
});
