import Store from 'electron-store';

interface StoreSchema {
  settings: {
    pollingInterval: number;
    autoRefresh: boolean;
  };
  theme: string;
  servers: any[];
  sidebarCollapsed: boolean;
}

export const store = new Store<StoreSchema>({
  defaults: {
    settings: { pollingInterval: 15000, autoRefresh: true },
    theme: "system",
    servers: [],
    sidebarCollapsed: false
  }
});