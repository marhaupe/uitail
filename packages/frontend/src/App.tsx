import { useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { ControlBar } from "./components/ControlBar";
import { useHotkeys } from "react-hotkeys-hook";
import { LogList, LogListRef } from "./components/LogList";
import { useQueryParams, StringParam, BooleanParam, withDefault } from "use-query-params";
import { useBackend } from "@/useBackend";
import { toast } from "sonner";

export function App() {
  const [filterState, setFilterState] = useQueryParams({
    message: withDefault(StringParam, undefined),
    caseSensitive: withDefault(BooleanParam, undefined),
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const logListRef = useRef<LogListRef>(null);
  const onLogsOverride = useCallback(() => {
    logListRef.current?.resetVirtualization();
  }, []);

  const {
    logs,
    connectionStatus,
    handleClear: _handleClear,
    handleRestart: _handleRestart,
  } = useBackend({
    onLogsOverride,
    filterState,
  });

  const handleClear = useCallback(() => {
    _handleClear()
      .then(() => {
        toast.success("Logs cleared");
      })
      .catch((error) => {
        console.error("Failed to clear logs", error);
        toast.error("Failed to clear logs");
      });
  }, [_handleClear]);

  const handleRestart = useCallback(() => {
    _handleRestart()
      .then(() => {
        toast.success("Agent restarted");
      })
      .catch((error) => {
        console.error("Failed to restart agent", error);
        toast.error("Failed to restart agent");
      });
  }, [_handleRestart]);

  useHotkeys("mod+k", () => {
    handleClear();
  });

  useHotkeys(
    "/",
    () => {
      searchInputRef.current?.focus();
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    }
  );

  useHotkeys(
    "escape",
    () => {
      searchInputRef.current?.blur();
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <div className="bg-slate-50 overflow-hidden">
      <div className="container p-6 h-screen">
        <Card className="relative flex flex-col flex-1">
          <ControlBar
            status={connectionStatus}
            filter={filterState}
            ref={searchInputRef}
            onFilterStateChange={(query) =>
              setFilterState({
                caseSensitive: Boolean(query.caseSensitive) || undefined,
                message: query.message || undefined,
              })
            }
            onClear={handleClear}
            onRestart={handleRestart}
            onScrollToTop={() => logListRef.current?.scrollToTop()}
            onScrollToBottom={() => logListRef.current?.scrollToBottom()}
          />
          <LogList ref={logListRef} logs={logs} />
        </Card>
      </div>
    </div>
  );
}
