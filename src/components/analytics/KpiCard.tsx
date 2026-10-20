import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'purple' | 'emerald' | 'amber' | 'blue';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'purple',
  trend,
}) => {
  const variantStyles = {
    purple: {
      bg: 'bg-purple-50 text-[#6D28D9]',
      border: 'border-purple-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-[#10B981]',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
  }[variant];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${variantStyles.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-gray-500 leading-normal">{subtitle}</p>}
    </div>
  );
};
