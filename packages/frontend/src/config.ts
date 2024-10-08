declare global {
  interface Window {
    injectedConfig: InjectedConfig;
  }
}

interface InjectedConfig {
  useDemoServer: boolean;
  port: number;
  command: string;
}

const defaultInjectedConfig: InjectedConfig = {
  useDemoServer: true,
  port: 8765,
  command: "",
};

export const config = {
  routes: {
    events: "/events",
    restart: "/restart",
    clear: "/clear",
  },
  ...defaultInjectedConfig,
  ...(window.injectedConfig || {}),
};
