import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Activity, MapPin } from 'lucide-react';

export default function LabHealthCard({ lab }) {
  const {
    id,
    code,
    name,
    room,
    inCharge,
    assistant,
    total,
    working,
    faulty,
    healthPercentage
  } = lab;

  const isHealthy = healthPercentage >= 90;
  const isModerate = healthPercentage >= 75 && healthPercentage < 90;

  const getStatusColor = () => {
    if (isHealthy) return 'bg-emerald-500 text-emerald-500';
    if (isModerate) return 'bg-amber-500 text-amber-500';
    return 'bg-rose-500 text-rose-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {code}
              </span>
              <span className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="w-3 h-3 mr-0.5" /> Room {room}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {name}
            </h3>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            isHealthy 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : isModerate 
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            <Activity className="w-3 h-3" />
            <span>{healthPercentage}% Health</span>
          </div>
        </div>

        {/* Staff details */}
        <div className="space-y-1.5 py-3 border-y border-slate-100 dark:border-slate-700/50 my-3 text-xs">
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <User className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 mr-1">In-Charge:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{inCharge}</span>
          </div>
          <div className="flex items-center text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 mr-1">Assistant:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{assistant}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Operational Status</span>
            <span>{working} / {total} Systems</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div 
              className={`h-full ${getStatusColor().split(' ')[0]} transition-all duration-500`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer link */}
      <Link
        to={`/lab/${id}`}
        className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors pt-1"
      >
        <span>View Equipment Audit Table</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
