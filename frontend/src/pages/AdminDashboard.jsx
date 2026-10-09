import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { 
  fetchSummary, 
  getAdminStatus, 
  syncGoogleSheets, 
  updateAdminRecord 
} from '../services/api';
import socket from '../services/socket';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Clock, 
  Monitor, 
  Cpu, 
  Server, 
  Check, 
  X, 
  ExternalLink,
  ArrowRight,
  Building2,
  Cloud
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [togglingRecordId, setTogglingRecordId] = useState(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, statusRes] = await Promise.all([
        fetchSummary(),
        getAdminStatus()
      ]);

      if (summaryRes.success) setSummaryData(summaryRes.data);
      if (statusRes.success) setStorageStatus(statusRes.storage);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      console.log('⚡ AdminDashboard live update received');
      loadData();
    };

    socket.on('dashboard:updated', handleUpdate);

    return () => {
      socket.off('dashboard:updated', handleUpdate);
    };
  }, [loadData]);

  const handleSyncToGoogleSheets = async () => {
    setSyncingSheets(true);
    try {
      const res = await syncGoogleSheets();
      if (res.success) {
        showToast('Successfully synchronized workbook with Google Sheets persistent cloud!');
        await loadData();
      } else {
        showToast(res.error || 'Failed to sync with Google Sheets', true);
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Sync failed', true);
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleQuickToggleStatus = async (item) => {
    const newStatus = item.status === 'Working' ? 'Faulty' : 'Working';
    const newMonStatus = newStatus === 'Working' ? 'YES' : 'NO';
    const newCpuStatus = newStatus === 'Working' ? 'YES' : 'NO';

    setTogglingRecordId(item.id);
    try {
      const res = await updateAdminRecord(item.id, {
        status: newStatus,
        monitorStatus: newMonStatus,
        cpuStatus: newCpuStatus,
        remarks: newStatus === 'Faulty' ? (item.remarks || 'Flagged faulty by Admin') : ''
      });

      if (res.success) {
        showToast(`System ${item.systemName} updated to ${newStatus}. Synced to cloud and broadcasted!`);
        await loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Status update failed', true);
    } finally {
      setTogglingRecordId(null);
    }
  };

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <AdminNavbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-400">Loading admin control center...</p>
        </div>
      </div>
    );
  }

  const {
    totalLabs = 6,
    totalComputers = 0,
    workingComputers = 0,
    faultyComputers = 0,
    workingPercentage = 100,
    recentIssues = [],
    labStatus = []
  } = summaryData || {};

  const isGoogleConfigured = storageStatus?.googleSheetsConfigured;
  const isGoogleConnected = storageStatus?.googleSheetsConnected;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminNavbar />

      {/* Toast alert */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
          toastMessage.isError 
            ? 'bg-rose-950 border-rose-800 text-rose-200' 
            : 'bg-emerald-950 border-emerald-800 text-emerald-200'
        }`}>
          {toastMessage.isError ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 inline-block mb-3">
              Administrator Master Panel
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Excel Data Synchronization Control Center
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Every save action updates persistent Google Sheets storage and instantly propagates live updates to all public viewers via Socket.IO without requiring page reloads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin/excel')}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet Editor</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>


          </div>
        </div>

        {/* Cloud Persistence & Storage Health Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                isGoogleConnected 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' 
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800'
              }`}>
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Persistent Storage Engine:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    isGoogleConnected 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isGoogleConnected ? 'Google Sheets Live' : isGoogleConfigured ? 'Connecting' : 'Local Fallback'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isGoogleConnected 
                    ? `Spreadsheet "${storageStatus?.spreadsheetTitle || 'AI&DS Lab Audit'}" actively synching to Google Cloud.` 
                    : 'To enable full cloud persistence across Render restarts, provide GOOGLE_SHEET_ID and Service Account credentials.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isGoogleConfigured && (
                <button
                  onClick={handleSyncToGoogleSheets}
                  disabled={syncingSheets}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="Push current workbook to Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSheets ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{syncingSheets ? 'Syncing...' : 'Sync to Google Sheets'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Spreadsheet ID</span>
              <span className="font-mono text-slate-300 truncate block">
                {storageStatus?.sheetId !== 'Not configured' ? storageStatus?.sheetId : 'Local Disk Mode'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Local Excel Path</span>
              <span className="font-mono text-slate-300 truncate block" title={storageStatus?.localExcelPath}>
                AI&DS Lab Audit sheet 2026-27.xlsx
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Last Synced</span>
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(storageStatus?.lastSynced || Date.now()).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Total Facilities</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalLabs} Labs</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Total Computers</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalComputers} Systems</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/40">
            <span className="text-xs font-semibold text-emerald-400 uppercase block">Working Units</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">{workingComputers}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40">
            <span className="text-xs font-semibold text-rose-400 uppercase block">Faulty Units</span>
            <span className="text-2xl font-black text-rose-300 mt-1 block">{faultyComputers}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-slate-400 uppercase block">Health Index</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">{workingPercentage}%</span>
          </div>
        </div>

        {/* Quick Instant Toggle Section for Fast Testing & Verification */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-400" />
                <span>Instant Computer Status Toggle & Live Synchronization</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle any computer status below. It persists to Google Sheets and instantly recalculates stats on Browser A without a page refresh!
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/excel')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View full editable spreadsheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Lab</th>
                  <th className="p-3">System Name</th>
                  <th className="p-3">Monitor (s/n)</th>
                  <th className="p-3">CPU (s/n)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 pr-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentIssues.length > 0 ? (
                  recentIssues.slice(0, 8).map((sys) => (
                    <tr key={sys.id} className="hover:bg-slate-800/40">
                      <td className="p-3 pl-4 font-bold text-indigo-400">{sys.labCode} ({sys.roomNo})</td>
                      <td className="p-3 font-semibold text-slate-200">{sys.systemName}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{sys.monitorSerial}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{sys.cpuSerial}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          sys.status === 'Working'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {sys.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 italic truncate max-w-xs">{sys.remarks || '-'}</td>
                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() => handleQuickToggleStatus(sys)}
                          disabled={togglingRecordId === sys.id}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                            sys.status === 'Faulty'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          } disabled:opacity-50`}
                        >
                          {togglingRecordId === sys.id 
                            ? 'Saving...' 
                            : sys.status === 'Faulty' 
                              ? 'Mark Working' 
                              : 'Mark Faulty'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No issues currently logged. All laboratory computers operational!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Laboratory Status Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Laboratory Audit Summary (6 Facilities)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labStatus.map((lab) => (
              <div key={lab.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    {lab.code} - Room {lab.room}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{lab.healthPercentage}% Health</span>
                </div>
                <h4 className="font-extrabold text-sm text-white">{lab.name}</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>In-Charge: <span className="text-slate-200 font-semibold">{lab.inCharge}</span></p>
                  <p>Assistant: <span className="text-slate-200 font-semibold">{lab.assistant}</span></p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total: <b className="text-white">{lab.total}</b></span>
                  <span className="text-emerald-400 font-semibold">Working: {lab.working}</span>
                  <span className="text-rose-400 font-semibold">Faulty: {lab.faulty}</span>
                </div>
                <Link
                  to={`/admin/excel?labId=${lab.id}`}
                  className="block w-full text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs border border-slate-700 transition-colors mt-2"
                >
                  Edit {lab.code} Spreadsheet
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
