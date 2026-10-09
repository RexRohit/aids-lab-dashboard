import React, { useState, useEffect } from 'react';
import { fetchSummary } from '../services/api';
import { 
  BarChart3, 
  Printer, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

import socket from '../services/socket';

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReportsData = React.useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetchSummary();
      if (res.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData(false);

    const handleUpdate = () => {
      console.log('⚡ ReportsPage received live update event');
      loadReportsData(true);
    };

    socket.on('dashboard:updated', handleUpdate);
    socket.on('excel-updated', handleUpdate);

    return () => {
      socket.off('dashboard:updated', handleUpdate);
      socket.off('excel-updated', handleUpdate);
    };
  }, [loadReportsData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Generating audit summary report...
        </p>
      </div>
    );
  }

  const {
    totalLabs = 6,
    totalComputers = 0,
    workingComputers = 0,
    faultyComputers = 0,
    workingPercentage = 100,
    labStatus = [],
    lastSynced
  } = summaryData || {};

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Top action bar */}
      <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Department Audit Reports
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Laboratory Audit Summary Report (2026-27)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official summary sheet compiled from Excel audit records
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Report</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-8 shadow-sm space-y-8">
        {/* Department Title Block */}
        <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
            Department of Artificial Intelligence & Data Science
          </h1>
          <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            Annual Laboratory Audit Summary Report (Academic Year 2026-27)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Primary Data Source: AI&DS Lab Audit sheet 2026-27.xlsx</span>
            <span>•</span>
            <span>Synced: {new Date(lastSynced || Date.now()).toLocaleString()}</span>
          </p>
        </div>

        {/* High Level KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block">Total Facilities</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalLabs} Labs</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block">Audited Systems</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalComputers} Units</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase block">Working Systems</span>
            <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1 block">{workingComputers} ({workingPercentage}%)</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase block">Faulty Systems</span>
            <span className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1 block">{faultyComputers} Units</span>
          </div>
        </div>

        {/* Laboratory Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Laboratory Breakdown & Operational Status</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="p-3 pl-4">Sr No</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Laboratory Name</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Lab In-Charge</th>
                  <th className="p-3">Lab Assistant</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Working</th>
                  <th className="p-3 text-center">Faulty</th>
                  <th className="p-3 pr-4 text-right">Health %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {labStatus.map((lab, idx) => (
                  <tr key={lab.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="p-3 pl-4 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{lab.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{lab.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{lab.room}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200">{lab.inCharge}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200">{lab.assistant}</td>
                    <td className="p-3 text-center font-semibold text-slate-800 dark:text-slate-100">{lab.total}</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{lab.working}</td>
                    <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400">{lab.faulty}</td>
                    <td className="p-3 pr-4 text-right font-black text-slate-900 dark:text-white">{lab.healthPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures section for print */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 text-center text-xs text-slate-600 dark:text-slate-400 font-semibold border-t border-slate-200 dark:border-slate-700">
          <div>
            <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-600 mb-2"></div>
            <span>Department Audit Committee</span>
          </div>
          <div>
            <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-600 mb-2"></div>
            <span>Head of Department (AI & DS)</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-600 mb-2"></div>
            <span>College Principal / Auditor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
