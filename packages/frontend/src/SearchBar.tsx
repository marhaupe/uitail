import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ref
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
    <div className="sticky rounded-md top-0 p-2 bg-background z-50">
      <form
        className="flex flex-row items-center justify-between h-10 text-sm gap-2"
        onSubmit={handleSubmit((data) => {
          onFilterStateChange({
            ...filter,
            message: data.message,
          });
        })}
      >
        <Input
          {...register("message")}
          id="message-input"
          placeholder="Filter ('/')"
        />
        <Button disabled={formState.isSubmitting} variant="ghost" type="submit">
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
