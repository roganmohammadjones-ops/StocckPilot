import React, { createContext, useContext, useState, useCallback } from 'react';
import { getWebDatabase, type AppDatabase } from './web-db';

interface DataRefreshContextType {
  dataVersion: number;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType>({
  dataVersion: 0,
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

const WebDbContext = createContext<AppDatabase>(getWebDatabase());

export function StockPilotDatabaseProvider({ children }: { children: React.ReactNode }) {
  const [dataVersion, setDataVersion] = useState(0);

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const webDb = getWebDatabase();

  return (
    <WebDbContext.Provider value={webDb}>
      <DataRefreshContext.Provider
        value={{ dataVersion, refreshTrigger: dataVersion, triggerRefresh }}
      >
        {children}
      </DataRefreshContext.Provider>
    </WebDbContext.Provider>
  );
}

export function useAppDb(): AppDatabase {
  return useContext(WebDbContext);
}

export function useDataRefresh() {
  return useContext(DataRefreshContext);
}
