declare global {
  interface Window {
    config: {
      port: number;
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
    port: 8765,
    command: "",
  }),
};
