import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  Clock,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';

export const DevBanner: React.FC = () => {
  const {
    cacheStats,
    workerStatus,
    toggleDemoMode,
    triggerWorkerCycle,
    clearCache,
    activeHoldsCount,
  } = useSystem();
  const { user, quickLogin, demoAccounts } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      const expiredCount = await triggerWorkerCycle();
      toast(
        expiredCount > 0
          ? `Worker completed: ${expiredCount} expired ticket hold(s) restored to inventory.`
          : 'Worker completed: No expired holds found.',
        'info',
        'Worker Execution'
      );
    } catch {
      toast('Failed to run worker cycle', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    toast('In-memory cache purged. Subsequent queries will read fresh from DB.', 'success', 'Cache Cleared');
  };

  const isCacheHit = cacheStats.lastAction === 'HIT';

  return (
    <div className="bg-[#111827] text-gray-200 border-b border-gray-800 text-xs transition-all z-40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Status Indicators */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
          <span className="font-mono font-bold tracking-wider text-purple-400 flex items-center gap-1.5 uppercase">
            <Activity className="w-3.5 h-3.5" /> Engine
          </span>

          {/* Cache Status Badge */}
          <div className="flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isCacheHit ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-gray-300">
              {isCacheHit ? '⚡ Cached (Hit)' : '🌱 DB Fresh (Miss)'}
            </span>
            <span className="text-gray-500 text-[11px] font-mono">
              [{cacheStats.hits}h / {cacheStats.misses}m]
            </span>
          </div>

          {/* Active Holds */}
          <div className="flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-300">
              Active Holds: <strong className="text-white">{activeHoldsCount}</strong>
            </span>
          </div>

          {/* Hold Duration Mode Badge */}
          <button
            onClick={() => {
              const next = !workerStatus.demoMode;
              toggleDemoMode(next);
              toast(
                next
                  ? 'Demo Mode Activated: Holds expire in 30 seconds!'
                  : 'Standard Mode Activated: Holds expire in 10 minutes.',
                'info',
                'Hold Policy Updated'
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium cursor-pointer transition ${
              workerStatus.demoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
            title="Click to toggle between 30s demo expiry and 10m standard hold"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{workerStatus.demoMode ? 'Demo Mode: 30s Hold' : 'Standard: 10m Hold'}</span>
          </button>
        </div>

        {/* Right: Quick Role Switcher + Expand */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switcher */}
          <div className="flex items-center gap-1.5 bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-700">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 hidden sm:inline">Role:</span>
            <select
              value={user?.id || ''}
              onChange={(e) => {
                quickLogin(e.target.value);
                const target = demoAccounts.find((u) => u.id === e.target.value);
                if (target) {
                  toast(`Switched to ${target.name} (${target.role})`, 'success');
                }
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              {demoAccounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-gray-900 text-white">
                  [{acc.role}] {acc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-white p-1 rounded-md transition"
            title="Toggle Engine Diagnostics"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Diagnostics Drawer */}
      {isOpen && (
        <div className="border-t border-gray-800 bg-[#0d131f] px-4 sm:px-6 lg:px-8 py-3 animate-in slide-in-from-top duration-150">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Worker Diagnostics */}
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" /> Background Expiry Cron
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">10s Interval</span>
              </div>
              <p className="text-gray-400 mb-2 leading-relaxed">
                Atomic cron checks for reservations past <code className="text-gray-300">expires_at</code>,
                acquires tier lock, marks <code className="text-rose-400">EXPIRED</code>, and invalidates cache.
              </p>
              <div className="flex items-center justify-between text-gray-400 text-[11px] mb-3">
                <span>Last run: {workerStatus.lastRunAt || 'Just now'}</span>
                <span>Total expired: {workerStatus.totalExpiredCount}</span>
              </div>
              <button
                onClick={handleTriggerCycle}
                disabled={isTriggering}
                className="w-full py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 flex items-center justify-center gap-2 font-medium transition cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
                <span>Force Run Expiry Scan</span>
              </button>
            </div>

            {/* Cache Diagnostics */}
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" /> In-Memory Cache (TTL: 30s)
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  Ratio:{' '}
                  {cacheStats.hits + cacheStats.misses > 0
                    ? Math.round(
                        (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <p className="text-gray-400 mb-2 leading-relaxed">
                Last Key: <span className="font-mono text-gray-300">{cacheStats.lastKey || 'None'}</span>
                <br />
                Last Action: <span className="font-mono text-purple-300">{cacheStats.lastAction}</span>
              </p>
              <button
                onClick={handleClearCache}
                className="w-full mt-5 py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center justify-center gap-2 font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Flush In-Memory Cache</span>
              </button>
            </div>

            {/* Simulated Architecture Notes */}
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
              <span className="font-semibold text-gray-300 mb-2 block">
                Production Parity Primitives
              </span>
              <ul className="space-y-1 text-gray-400 text-[11px] list-disc list-inside">
                <li>
                  <strong className="text-gray-300">Locking:</strong> Tier-keyed async mutex mimicking
                  PostgreSQL <code className="text-purple-300">SELECT ... FOR UPDATE</code>
                </li>
                <li>
                  <strong className="text-gray-300">Worker:</strong> Repeatable background cron mimicking BullMQ / Celery
                </li>
                <li>
                  <strong className="text-gray-300">Idempotency:</strong> Token store preventing double-charging on checkout
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
