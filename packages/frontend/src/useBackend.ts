import { FilterState } from "@/components/ControlBar";
import { config } from "@/config";
import { Log } from "@/types";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";

interface UseBackendProps {
  onLogsOverride: () => void;
  filterState: FilterState;
}

interface Backend {
  logs: Log[];
  connectionStatus: "active" | "inactive";
  handleClear: () => Promise<void>;
  handleRestart: () => Promise<void>;
}

export function useBackend({ onLogsOverride, filterState }: UseBackendProps): Backend {
  const demoBackend = useDemoBackend({ onLogsOverride });
  const defaultBackend = useDefaultBackend({ onLogsOverride, filterState });
  return config.useDemoServer ? demoBackend : defaultBackend;
}

function useDefaultBackend({ onLogsOverride, filterState }: UseBackendProps): Backend {
  const [logs, setLogs] = useState<Log[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    const url = new URL(`http://localhost:${config.port}${config.routes.events}`);
    url.searchParams.set("stream", nanoid());
    if (filterState.message) {
      url.searchParams.set("filter", filterState.message);
    }
    if (filterState.caseSensitive) {
      url.searchParams.set("caseSensitive", filterState.caseSensitive.toString());
    }
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnectionStatus("active");
    };

    eventSource.onerror = () => {
      setConnectionStatus("inactive");
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const incomingLogs = JSON.parse(event.data);
        if (incomingLogs.length !== 1) {
          onLogsOverride();
          setLogs(incomingLogs);
        } else {
          setLogs((prevLogs) => [...prevLogs, ...incomingLogs]);
        }
      } catch (error) {
        console.error("Error parsing log", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [filterState, onLogsOverride]);

  async function handleClear() {
    const response = await fetch(`http://localhost:${config.port}${config.routes.clear}`, {
      method: "POST",
    });
    if (response.ok) {
      setLogs([]);
    }
  }

  async function handleRestart() {
    const response = await fetch(`http://localhost:${config.port}${config.routes.restart}`, {
      method: "POST",
    });
    if (response.ok) {
      setConnectionStatus("active");
    }
  }

  return {
    logs,
    connectionStatus,
    handleClear,
    handleRestart,
  };
}

function useDemoBackend({ onLogsOverride }: Pick<UseBackendProps, "onLogsOverride">): Backend {
  const [logs, setLogs] = useState<Log[]>([
    { id: nanoid(), message: "Server started", timestamp: new Date().toISOString() },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = getRandomLog();
      setLogs((prevLogs) => [...prevLogs, randomLog]);
    }, 2000);
    return () => clearInterval(interval);
  }, [onLogsOverride]);

  return {
    handleClear: () => {
      setLogs([]);
      return Promise.resolve();
    },
    handleRestart: () => {
      setLogs((prevLogs) => [
        ...prevLogs,
        {
          id: nanoid(),
          message: "Server restarted",
          timestamp: new Date().toISOString(),
        },
      ]);
      return Promise.resolve();
    },
    logs,
    connectionStatus: "active",
  };
}

function getRandomLog(): Log {
  const logMessages = [
    "dev: object " + JSON.stringify({ dev: "dev" }, null, 2),
    "dev: array " + JSON.stringify([1, 2, 3, 4], null, 2),
    "dev: large array " +
      JSON.stringify(
        Array.from({ length: 20 }, (_, i) => i + 1),
        null,
        2
      ),
    "dev: largeobject " +
      JSON.stringify(
        {
          a: "dev",
          b: "dev",
          c: "dev",
          d: "dev",
          e: "dev",
          f: "dev",
          g: "dev",
        },
        null,
        2
      ),
    "dev: error " + new Error("test error"),
  ];

  const message = logMessages[Math.floor(Math.random() * logMessages.length)];
  return {
    id: nanoid(),
    message,
    timestamp: new Date().toISOString(),
  };
}
