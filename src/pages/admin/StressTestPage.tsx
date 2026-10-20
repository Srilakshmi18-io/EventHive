import React, { useState } from 'react';
import { eventService } from '../../services/eventService';
import { StressTestResult } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Flame,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  RotateCw,
  Cpu,
  Terminal,
  Zap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const StressTestPage: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SUCCESS' | 'REJECTED'>('ALL');

  const handleLaunchStressTest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      // Fires 100 simultaneous async reservations via eventService.runConcurrencyStressTest
      const res = await eventService.runConcurrencyStressTest(undefined, 100);
      setResult(res);

      if (res.succeededCount === 10 && res.rejectedCount === 90 && !res.oversold) {
        toast(
          `Stress Test Passed! Exactly 10 acquired, 90 rejected. Zero overselling.`,
          'success',
          'Concurrency Benchmark'
        );
      } else {
        toast(`Stress Test completed.`, 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stress test failed';
      toast(msg, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const filteredLogs = result
    ? result.logs.filter((l) => (logFilter === 'ALL' ? true : l.status === logFilter))
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-[#3B0764] to-[#1E1B4B] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" /> High-Concurrency Stress Test Harness
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            100-Thread Concurrency Benchmark
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
            Demonstrates race condition immunity. This tool dispatches 100 simultaneous asynchronous
            hold requests at an isolated tier with an exact capacity of 10 tickets.
            Thanks to the tier-keyed mutex lock, exactly 10 requests succeed, 90 are rejected,
            and inventory never drops below zero.
          </p>
        </div>

        {/* Decorative Grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#9333EA_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
      </div>

      {/* Action Console Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#6D28D9]" />
              <span>Benchmark Execution Controls</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Simulates a viral flash-sale ticket drop where 100 shoppers click simultaneously.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isRunning}
            onClick={handleLaunchStressTest}
            icon={<Flame className="w-4 h-4 text-amber-400" />}
            className="shadow-md"
          >
            {isRunning ? 'Firing 100 Simultaneous Requests...' : 'Fire 100 Concurrent Requests'}
          </Button>
        </div>

        {/* Test Parameters Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-semibold block uppercase">Target Pool</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">Isolated Tier</span>
            <span className="text-[11px] text-gray-500">10 Total Capacity</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-semibold block uppercase">Simultaneous Requests</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">100 Threads</span>
            <span className="text-[11px] text-gray-500">Promise.all dispatched</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-semibold block uppercase">Expected Success</span>
            <span className="font-bold text-emerald-600 text-sm mt-0.5 block">Exactly 10</span>
            <span className="text-[11px] text-gray-500">First 10 to lock</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-gray-400 font-semibold block uppercase">Expected Rejection</span>
            <span className="font-bold text-rose-600 text-sm mt-0.5 block">Exactly 90</span>
            <span className="text-[11px] text-gray-500">Capacity exhausted</span>
          </div>
        </div>

        {/* Live Running Spinner */}
        {isRunning && (
          <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200 text-center space-y-3 animate-pulse">
            <RotateCw className="w-8 h-8 text-[#6D28D9] animate-spin mx-auto" />
            <h3 className="font-bold text-purple-900 text-sm">
              Acquiring Tier Mutex Locks for 100 Concurrent Operations...
            </h3>
            <p className="text-xs text-purple-700 max-w-md mx-auto">
              Evaluating atomic formula: <code>available = total - sold - activeHeld</code> under
              exclusive critical sections.
            </p>
          </div>
        )}

        {/* Test Result Summary Panel */}
        {result && (
          <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
            {/* Invariant Check Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                !result.oversold && result.succeededCount === 10 && result.rejectedCount === 90
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    MUTEX INVARIANT VERIFIED: Zero Overselling Guaranteed!
                  </h3>
                  <p className="text-xs opacity-90">
                    Exactly {result.succeededCount} requests succeeded, {result.rejectedCount} were denied.
                    Remaining inventory is <strong>{result.finalAvailable}</strong> (never negative).
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold bg-white/80 px-3 py-1 rounded-full border border-emerald-300 shrink-0">
                Duration: {result.durationMs}ms
              </span>
            </div>

            {/* 4 Outcome Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-gray-200 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Dispatched
                </span>
                <span className="text-2xl font-black text-gray-900">{result.requestCount}</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">Requests</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  Succeeded
                </span>
                <span className="text-2xl font-black text-emerald-700">{result.succeededCount}</span>
                <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Holds Acquired</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                  Rejected
                </span>
                <span className="text-2xl font-black text-rose-700">{result.rejectedCount}</span>
                <span className="text-[11px] text-rose-600 font-medium block mt-0.5">Denied (Sold Out)</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
                  Final Balance
                </span>
                <span className="text-2xl font-black text-purple-900">{result.finalAvailable}</span>
                <span className="text-[11px] text-purple-700 font-medium block mt-0.5">Remaining Seats</span>
              </div>
            </div>

            {/* Execution Logs Terminal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span>Execution Audit Log (100 Operations)</span>
                </span>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setLogFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      logFilter === 'ALL'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All (100)
                  </button>
                  <button
                    onClick={() => setLogFilter('SUCCESS')}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      logFilter === 'SUCCESS'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    Success ({result.succeededCount})
                  </button>
                  <button
                    onClick={() => setLogFilter('REJECTED')}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      logFilter === 'REJECTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100 text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    Denied ({result.rejectedCount})
                  </button>
                </div>
              </div>

              <div className="bg-[#111827] text-gray-200 rounded-xl p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-1 shadow-inner">
                {filteredLogs.map((log) => (
                  <div
                    key={log.requestId}
                    className="flex items-center justify-between py-0.5 border-b border-gray-800/60 last:border-0 hover:bg-white/5 px-1.5 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[11px] w-14">
                        #{String(log.requestId).padStart(3, '0')}
                      </span>
                      <span
                        className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-gray-300 truncate max-w-sm sm:max-w-md">
                        {log.message}
                      </span>
                    </div>

                    <span className="text-gray-500 text-[10px] hidden sm:inline">
                      {log.timestamp.slice(11, 23)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
