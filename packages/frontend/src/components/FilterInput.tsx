import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UseFormRegister } from "react-hook-form";

type FilterInputProps = {
  register: UseFormRegister<{ message: string | undefined; caseSensitive: boolean | undefined }>;
  caseSensitive: boolean;
  onCaseSensitiveChange: (pressed: boolean) => void;
  message: string;
};

export function FilterInput({
  register,
  caseSensitive,
  onCaseSensitiveChange,
  message,
}: FilterInputProps) {
  return (
    <div className="relative flex-grow">
      <Input {...register("message")} id="message-input" className="font-mono text-xs pr-16 peer" />
      {message.length === 0 && (
        <div className="absolute top-0 bottom-0 left-3 flex items-center peer-focus:invisible visible">
          <Badge variant="outline" className="flex gap-1 items-center">
            <p className="text-[10px] font-mono font-normal">Focus</p>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              /
            </kbd>
          </Badge>
        </div>
      )}
      <div className="absolute top-0 right-0 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              aria-label="Match case"
              pressed={caseSensitive}
              onPressedChange={onCaseSensitiveChange}
            >
              Aa
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Match case</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
