import { Button } from "@/components/ui/button";
import { TextSearchIcon } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";

type Props = {
  onSearch: (query: string) => void;
};

export const SearchQueryBuilder = forwardRef(function SearchQueryBuilder(
  props: Props,
  ref
) {
  const { register, handleSubmit, formState, setFocus } = useForm();

  useImperativeHandle(ref, () => ({
    focus: () => {
      setFocus("query");
    },
  }));

  return (
    <div className="w-96 sticky top-4 ml-auto h-0">
      <form
        className="flex flex-row items-center justify-between h-10 rounded-md border text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-4 mr-4"
        onSubmit={handleSubmit((data) => {
          props.onSearch(data.query);
        })}
      >
        <input
          {...register("query")}
          placeholder="Filter"
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
    </div>
  );
});
