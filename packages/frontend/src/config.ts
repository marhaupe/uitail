interface InjectedConfig {
  backendURL: string;
  command?: string;
}

declare global {
  interface Window {
    config: InjectedConfig;
  }
}

const defaultInjectedConfig: InjectedConfig = {
  backendURL: "http://localhost:8765",
};

export const config = {
  routes: {
    events: "/events",
    restart: "/restart",
    clear: "/clear",
  },
  ...defaultInjectedConfig,
  ...(window.config || {}),
};
