import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLabById } from '../services/api';
import EquipmentTable from '../components/EquipmentTable';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  ArrowLeft, 
  RefreshCw,
  AlertCircle,
  Cpu,
  Monitor,
  Terminal,
  Globe,
  Coins,
  Maximize2
} from 'lucide-react';

import socket from '../services/socket';

export default function LabPage() {
  const { id } = useParams();
  const [labData, setLabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLabDetails = React.useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetchLabById(id);
      if (res.success) {
        setLabData(res.data);
        setError(null);
      } else {
        setError(res.message || 'Lab not found');
      }
    } catch (err) {
      console.error(`Failed to fetch lab details for ${id}:`, err);
      if (!isBackground) setError(err.message || 'Failed to connect to server');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    getLabDetails(false);

    const handleUpdate = () => {
      console.log(`⚡ LabPage received live update event for ${id}`);
      getLabDetails(true);
    };

    socket.on('dashboard:updated', handleUpdate);
    socket.on('excel-updated', handleUpdate);

    return () => {
      socket.off('dashboard:updated', handleUpdate);
      socket.off('excel-updated', handleUpdate);
    };
  }, [id, getLabDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Fetching laboratory audit records...
        </p>
      </div>
    );
  }

  if (error || !labData) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Laboratory Audit Not Found</h3>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{error || 'Requested laboratory code does not exist.'}</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const {
    code,
    name,
    room,
    inCharge,
    assistant,
    cost,
    area,
    os,
    tools,
    hardware,
    browsers,
    misc,
    totalCount,
    workingCount,
    faultyCount,
    healthPercentage,
    systems = []
  } = labData;

  const isHealthy = healthPercentage >= 90;
  const isModerate = healthPercentage >= 75 && healthPercentage < 90;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Sheet: {labData.sheetName}</span>
      </div>

      {/* Lab Information Header Card */}
      <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                {code}
              </span>
              <span className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Room Number: {room}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Department of Artificial Intelligence & Data Science
            </p>
          </div>

          {/* Health Index Badge */}
          <div className="flex items-center gap-3">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isHealthy 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : isModerate
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              <Activity className="w-8 h-8" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block opacity-80">Health Index</span>
                <span className="text-2xl font-black">{healthPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff & Systems Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Lab In-Charge</span>
            <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4 mr-1.5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{inCharge}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Lab Assistant</span>
            <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{assistant}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Working Systems</span>
            <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200">{workingCount} / {totalCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase block mb-1">Not Working</span>
            <span className="text-xl font-bold text-rose-900 dark:text-rose-200">{faultyCount}</span>
          </div>
        </div>

        {/* Specifications & Hardware Info section directly from Excel Sheet */}
        {(area !== 'N/A' || os !== 'N/A' || hardware !== 'N/A') && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Laboratory Specifications & Setup</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {area && area !== 'N/A' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-500" /> Area of Laboratory:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{area}</span>
                </div>
              )}

              {cost && cost !== 'N/A' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" /> Total Lab Cost:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{cost}</span>
                </div>
              )}

              {os && os !== 'N/A' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-blue-500" /> Operating Systems:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{os}</span>
                </div>
              )}

              {tools && tools !== 'N/A' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 col-span-1 md:col-span-2">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Programming Tools:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{tools}</span>
                </div>
              )}

              {hardware && hardware !== 'N/A' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 col-span-1 md:col-span-3">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" /> Hardware Configuration:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block leading-relaxed">{hardware}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Audit Table */}
      <EquipmentTable 
        equipment={systems} 
        title={`${code} Equipment Audit Table`} 
        showLabColumn={false}
      />
    </div>
  );
}
