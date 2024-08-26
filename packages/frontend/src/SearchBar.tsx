import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextSearchIcon, XIcon } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";

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
  ref,
) {
  const { register, handleSubmit, formState, setFocus } = useForm();

  useImperativeHandle(ref, () => ({
    focus: () => {
      setFocus("message");
    },
    blur: () => {
      document.getElementById("message-input")?.blur();
    },
  }));

  return (
    <div className="sticky rounded-md top-0 p-2 bg-background">
      <form
        className="flex flex-row items-center justify-between h-10 rounded-md border text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        onSubmit={handleSubmit((data) => {
          onFilterStateChange({
            ...filter,
            message: data.message,
          });
        })}
      >
        <input
          {...register("message")}
          id="message-input"
          placeholder="Filter ('/')"
          className="px-3 py-2 flex-grow file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none"
        />
        <Button
          disabled={formState.isSubmitting}
          className="p-2 rounded-l-none"
          variant="outline"
          type="submit"
        >
          <TextSearchIcon className="size-6" />
        </Button>
      </form>
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
