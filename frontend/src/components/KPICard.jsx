import React from 'react';
import { 
  Building2, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  Wrench 
} from 'lucide-react';

export default function KPICard({ title, value, subtitle, type, trend }) {
  const getIconAndStyle = () => {
    switch (type) {
      case 'labs':
        return {
          icon: Building2,
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          borderColor: 'border-indigo-100 dark:border-indigo-900/50'
        };
      case 'total':
        return {
          icon: Monitor,
          bgColor: 'bg-blue-50 dark:bg-blue-950/40',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-100 dark:border-blue-900/50'
        };
      case 'working':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          borderColor: 'border-emerald-100 dark:border-emerald-900/50'
        };
      case 'faulty':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-rose-50 dark:bg-rose-950/40',
          textColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-100 dark:border-rose-900/50'
        };
      case 'percentage':
        return {
          icon: Percent,
          bgColor: 'bg-amber-50 dark:bg-amber-950/40',
          textColor: 'text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-100 dark:border-amber-900/50'
        };
      case 'issues':
        return {
          icon: Wrench,
          bgColor: 'bg-purple-50 dark:bg-purple-950/40',
          textColor: 'text-purple-600 dark:text-purple-400',
          borderColor: 'border-purple-100 dark:border-purple-900/50'
        };
      default:
        return {
          icon: Monitor,
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          textColor: 'text-slate-600 dark:text-slate-300',
          borderColor: 'border-slate-200 dark:border-slate-700'
        };
    }
  };

  const style = getIconAndStyle();
  const Icon = style.icon;

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-800/90 border ${style.borderColor} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${style.bgColor} ${style.textColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
