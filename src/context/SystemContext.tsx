import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { systemCache, CacheStats } from '../services/cache';
import { expiryWorker, WorkerStatus } from '../services/worker';
import { db } from '../services/db';

interface SystemContextType {
  cacheStats: CacheStats;
  workerStatus: WorkerStatus;
  toggleDemoMode: (enabled: boolean) => void;
  triggerWorkerCycle: () => Promise<number>;
  clearCache: () => void;
  activeHoldsCount: number;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cacheStats, setCacheStats] = useState<CacheStats>(systemCache.getStats());
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>(expiryWorker.getStatus());
  const [activeHoldsCount, setActiveHoldsCount] = useState<number>(0);

  // Subscribe to cache and worker events
  useEffect(() => {
    const unsubCache = systemCache.subscribe((stats) => {
      setCacheStats(stats);
      updateActiveHolds();
    });

    const unsubWorker = expiryWorker.subscribe((status) => {
      setWorkerStatus(status);
      updateActiveHolds();
    });

    updateActiveHolds();
    const interval = setInterval(updateActiveHolds, 3000);

    return () => {
      unsubCache();
      unsubWorker();
      clearInterval(interval);
    };
  }, []);

  const updateActiveHolds = () => {
    const now = new Date().getTime();
    const activeHolds = db
      .getReservations()
      .filter((r) => r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now);
    const count = activeHolds.reduce((sum, r) => sum + r.quantity, 0);
    setActiveHoldsCount(count);
  };

  const toggleDemoMode = (enabled: boolean) => {
    expiryWorker.setDemoMode(enabled);
    setWorkerStatus(expiryWorker.getStatus());
  };

  const triggerWorkerCycle = async () => {
    const expiredCount = await expiryWorker.runCycle();
    updateActiveHolds();
    return expiredCount;
  };

  const clearCache = () => {
    systemCache.clear();
  };

  return (
    <SystemContext.Provider
      value={{
        cacheStats,
        workerStatus,
        toggleDemoMode,
        triggerWorkerCycle,
        clearCache,
        activeHoldsCount,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
