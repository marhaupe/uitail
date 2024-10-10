declare global {
  interface Window {
    config: {
      backendURL: string;
      command: string;
    };
  }
}

export const config = {
  routes: {
    events: "/events",
    restart: "/restart",
    clear: "/clear",
  },
  ...(window.config || {
    backendURL: "http://localhost:8765",
    command: "",
  }),
};
