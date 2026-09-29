import React from 'react';
import { AlertOctagon, Wrench, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentIssuesTable({ issues = [] }) {
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <span>Recent Equipment Issues</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800">
              {issues.length} Active
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Systems flagged with hardware faults requiring attention
          </p>
        </div>

        <Link
          to="/equipment?status=faulty"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View All Issues</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="p-3.5 pl-5">Lab</th>
              <th className="p-3.5">System Name</th>
              <th className="p-3.5">Dead Stock No</th>
              <th className="p-3.5">Reported Issue / Remarks</th>
              <th className="p-3.5">Supplier</th>
              <th className="p-3.5 pr-5">Action Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Wrench className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">All Laboratory Systems Operational!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No faulty equipment logged in Excel audit sheet.</p>
                </td>
              </tr>
            ) : (
              issues.slice(0, 8).map((issue, idx) => (
                <tr key={issue.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3.5 pl-5">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                      {issue.labCode} ({issue.roomNo})
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {issue.systemName}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                    {issue.deadStockNo}
                  </td>
                  <td className="p-3.5 font-medium text-rose-600 dark:text-rose-400 max-w-xs">
                    {issue.remarks}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    {issue.supplier}
                  </td>
                  <td className="p-3.5 pr-5">
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                      Under Repair
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
