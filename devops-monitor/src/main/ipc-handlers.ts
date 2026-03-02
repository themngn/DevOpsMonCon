import { ipcMain } from 'electron';
import { store, StoreSchema } from './store';

export function registerIpcHandlers() {
  ipcMain.handle('store:get', (_, key: keyof StoreSchema) => {
    return store.get(key as any);
  });

  ipcMain.handle('store:set', (_, key: keyof StoreSchema, value: any) => {
    store.set(key as any, value);
  });
}