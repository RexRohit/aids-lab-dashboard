import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export function LabStatusBarChart({ data = [] }) {
  const chartData = data.map(lab => ({
    name: lab.code,
    Working: lab.working,
    Faulty: lab.faulty,
    Total: lab.total
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold border-b border-slate-800 pb-1 mb-1">{label} Laboratory</p>
          <p className="text-emerald-400 font-semibold">Working: {payload[0]?.value} systems</p>
          <p className="text-rose-400 font-semibold">Faulty: {payload[1]?.value} systems</p>
          <p className="text-slate-300 mt-1 pt-1 border-t border-slate-800">Total: {payload[0]?.value + payload[1]?.value} systems</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lab-wise Computer Status</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comparison of working vs faulty computers across labs</p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Working</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Faulty</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Working" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Faulty" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EquipmentDonutChart({ working = 0, faulty = 0 }) {
  const data = [
    { name: 'Working Equipment', value: working, color: '#10b981' },
    { name: 'Faulty Equipment', value: faulty, color: '#f43f5e' }
  ];

  const total = working + faulty;
  const workingPercentage = total > 0 ? ((working / total) * 100).toFixed(1) : 100;

  return (
    <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Working vs Faulty Breakdown</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Department equipment health ratio</p>
      </div>

      <div className="w-full h-56 relative flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} Systems`, 'Count']}
              contentStyle={{ background: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {workingPercentage}%
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Working</p>
          <p className="text-base font-bold text-emerald-900 dark:text-emerald-200">{working}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Faulty</p>
          <p className="text-base font-bold text-rose-900 dark:text-rose-200">{faulty}</p>
        </div>
      </div>
    </div>
  );
}
