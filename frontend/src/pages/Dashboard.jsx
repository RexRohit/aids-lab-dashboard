import React from 'react';
import KPICard from '../components/KPICard';
import { LabStatusBarChart, EquipmentDonutChart } from '../components/Charts';
import LabHealthCard from '../components/LabHealthCard';
import RecentIssuesTable from '../components/RecentIssuesTable';
import { RefreshCw, FileText, AlertCircle } from 'lucide-react';

export default function Dashboard({ summaryData, loading, error, refreshData }) {
  if (loading && !summaryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Loading audit workbook metrics...
        </p>
      </div>
    );
  }

  if (error && !summaryData) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Unable to load audit summary</h3>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{error}</p>
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors shadow-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalLabs = 6,
    totalComputers = 0,
    workingComputers = 0,
    faultyComputers = 0,
    workingPercentage = 100,
    equipmentIssues = 0,
    labStatus = [],
    recentIssues = []
  } = summaryData || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none p-6">
          <FileText className="w-64 h-64 -mr-10 -mt-10" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 inline-block mb-3">
            Academic Year 2026-27 Audit Overview
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Department of AI & DS Laboratory Audit Dashboard
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
            Real-time laboratory asset tracking, system health monitoring, and hardware audit analytics synced directly from Excel.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          type="labs"
          title="Total Labs"
          value={totalLabs}
          subtitle="Department Facilities"
        />
        <KPICard
          type="total"
          title="Total Computers"
          value={totalComputers}
          subtitle="Audited Systems"
        />
        <KPICard
          type="working"
          title="Working"
          value={workingComputers}
          subtitle="Fully Operational"
          trend={{ positive: true, text: 'Active' }}
        />
        <KPICard
          type="faulty"
          title="Faulty"
          value={faultyComputers}
          subtitle="Need Maintenance"
          trend={{ positive: false, text: `${faultyComputers} issues` }}
        />
        <KPICard
          type="percentage"
          title="Working %"
          value={`${workingPercentage}%`}
          subtitle="Health Index"
        />
        <KPICard
          type="issues"
          title="Equipment Issues"
          value={equipmentIssues}
          subtitle="Logged Remarks"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LabStatusBarChart data={labStatus} />
        </div>
        <div>
          <EquipmentDonutChart working={workingComputers} faulty={faultyComputers} />
        </div>
      </div>

      {/* Laboratory Health Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laboratory Status & Health</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live system counts and faculty in-charge for each lab</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labStatus.map(lab => (
            <LabHealthCard key={lab.id} lab={lab} />
          ))}
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="pt-2">
        <RecentIssuesTable issues={recentIssues} />
      </div>
    </div>
  );
}
