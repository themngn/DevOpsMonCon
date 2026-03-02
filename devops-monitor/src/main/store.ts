import Store from 'electron-store';

export interface StoreSchema {
  settings: {
    pollingInterval: number;
    autoRefresh: boolean;
  };
  theme: string;
  servers: any[];
  sidebarCollapsed: boolean;
}

// Fix for "Store is not a constructor" error when using electron-store v7+ in CJS environment
//const StoreClass = (Store as any).default || Store;

//export const store = new StoreClass<StoreSchema>({
export const store = new Store<StoreSchema>({
  defaults: {
    settings: { pollingInterval: 15000, autoRefresh: true },
    theme: "system",
    servers: [],
    sidebarCollapsed: false
  }
});