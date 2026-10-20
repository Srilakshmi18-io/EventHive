import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

interface CountdownTimerProps {
  expiresAt: string; // ISO date string
  onExpire: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  className = '',
}) => {
  const { workerStatus } = useSystem();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(interval);
        onExpire();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining <= 120; // Under 2 minutes
  const isCritical = secondsRemaining <= 30; // Under 30 seconds

  // Total duration estimation for progress bar
  const totalDuration = workerStatus.demoMode ? 30 : 600;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / totalDuration) * 100));

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isCritical
          ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
          : isUrgent
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-purple-50 border-purple-200 text-purple-900'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
          ) : (
            <Clock className="w-5 h-5 text-purple-600" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {isUrgent ? 'Ticket Hold Expiring Soon!' : 'Temporary Ticket Hold Active'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {workerStatus.demoMode && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> Demo Mode (30s)
            </span>
          )}
          <div className="font-mono text-lg font-bold tracking-tight">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isCritical ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-[#6D28D9]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-xs mt-2 text-opacity-80 opacity-90 leading-relaxed">
        {isUrgent
          ? 'Hurry! Once the timer hits 00:00, this hold is automatically released and returned to the public pool.'
          : 'Your selected tickets are locked exclusively for you. Complete payment before the timer expires.'}
      </p>
    </div>
  );
};
