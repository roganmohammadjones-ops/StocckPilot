import React, { createContext, useContext, useState, useCallback } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase } from './init';

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

export function StockPilotDatabaseProvider({ children }: { children: React.ReactNode }) {
  const [dataVersion, setDataVersion] = useState(0);

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  return (
    <SQLiteProvider databaseName="stockpilot.db" onInit={initDatabase}>
      <DataRefreshContext.Provider
        value={{ dataVersion, refreshTrigger: dataVersion, triggerRefresh }}
      >
        {children}
      </DataRefreshContext.Provider>
    </SQLiteProvider>
  );
}

export function useDataRefresh() {
  return useContext(DataRefreshContext);
}
