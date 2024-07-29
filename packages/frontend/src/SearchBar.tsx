import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
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
    <form
      className="flex flex-row items-center justify-between h-10 w-full rounded-md border text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      onSubmit={handleSubmit((data) => {
        console.log(`dev: data`, data);
        props.onSearch(data.query);
      })}
    >
      <input
        {...register("query")}
        // ref={ref}
        placeholder="Query"
        className="px-3 py-2 flex-grow bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none"
      />
      <Button
        disabled={formState.isSubmitting}
        className="p-2"
        variant="default"
        type="submit"
      >
        <PlayIcon className="size-6" />
      </Button>
    </form>
  );
});
