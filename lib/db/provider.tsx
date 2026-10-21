import React, { createContext, useContext, useState, useCallback, Suspense } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { initDatabase } from './init';
import { BrandLoader } from '@/components/brand-loader';

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
    <Suspense
      fallback={
        <BrandLoader
          fullscreen
          size="large"
          message="Preparing StockPilot Nigeria offline ledger..."
        />
      }
    >
      <SQLiteProvider databaseName="stockpilot.db" onInit={initDatabase} useSuspense>
        <DataRefreshContext.Provider
          value={{ dataVersion, refreshTrigger: dataVersion, triggerRefresh }}
        >
          {children}
        </DataRefreshContext.Provider>
      </SQLiteProvider>
    </Suspense>
  );
}

export function useDataRefresh() {
  return useContext(DataRefreshContext);
}
