import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { UseFormRegister } from "react-hook-form";

type FilterInputProps = {
  register: UseFormRegister<{
    query: string | undefined;
    caseSensitive: boolean | undefined;
    regex: boolean | undefined;
  }>;
  onCaseSensitiveChange: (pressed: boolean) => void;
  onRegexChange: (pressed: boolean) => void;
  caseSensitive: boolean;
  query: string;
  regex: boolean;
};

export function FilterInput({
  register,
  caseSensitive,
  onCaseSensitiveChange,
  onRegexChange,
  query,
  regex,
}: FilterInputProps) {
  return (
    <div className="relative w-full">
      <Input {...register("query")} id="query-input" className="font-mono text-xs pr-28 peer" />
      {query.length === 0 && (
        <div className="absolute top-0 bottom-0 left-3 flex items-center peer-focus:invisible visible cursor-text pointer-events-none">
          <Badge className="flex gap-1 items-center border-slate-100 bg-slate-50 rounded-md text-slate-500">
            <p className="text-[10px] font-mono font-normal">Filter</p>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 border-slate-200 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              /
            </kbd>
          </Badge>
        </div>
      )}
      <div className="absolute top-0 right-0 flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Toggle
                  aria-label="Use Regular Expression"
                  pressed={regex}
                  onPressedChange={onRegexChange}
                  className="font-mono text-xs border border-r-0 rounded-none"
                >
                  .*
                </Toggle>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Use Regular Expression</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Toggle
                  aria-label="Match Case"
                  pressed={caseSensitive}
                  onPressedChange={onCaseSensitiveChange}
                  className="font-mono text-xs border rounded-none rounded-tr-md rounded-br-md"
                >
                  Aa
                </Toggle>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Match Case</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
