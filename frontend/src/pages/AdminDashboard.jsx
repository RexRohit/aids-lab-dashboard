import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { 
  fetchSummary, 
  getAdminStatus, 
  syncGoogleSheets, 
  previewAdminExcel,
  uploadAdminExcel,
  updateAdminRecord 
} from '../services/api';
import socket from '../services/socket';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Clock, 
  Monitor, 
  Cpu, 
  Server, 
  Check, 
  X, 
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileUp,
  Cloud
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);
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
    socket.on('excel-updated', handleUpdate);

    return () => {
      socket.off('dashboard:updated', handleUpdate);
      socket.off('excel-updated', handleUpdate);
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

  // Handle file select -> immediate validation & preview
  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setUploadError('Only Excel spreadsheet files (.xlsx, .xls) are allowed.');
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setPreviewData(null);
    setAnalyzingFile(true);

    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const res = await previewAdminExcel(formData);
      if (res.success && res.preview) {
        setPreviewData(res.preview);
      } else {
        setUploadError(res.error || 'Spreadsheet validation failed.');
      }
    } catch (err) {
      console.error('Spreadsheet preview error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to inspect Excel file schema.';
      setUploadError(errMsg);
      if (err.response?.data?.preview) {
        setPreviewData(err.response.data.preview);
      }
    } finally {
      setAnalyzingFile(false);
    }
  };

  // Confirm Import -> Save to Google Sheets
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      const res = await uploadAdminExcel(formData);
      if (res.success) {
        showToast(`Excel workbook "${selectedFile.name}" successfully imported and synced to Google Sheets!`);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setPreviewData(null);
        setUploadError(null);
        await loadData();
      } else {
        setUploadError(res.error || 'Failed to import workbook.');
        showToast(res.error || 'Failed to import workbook.', true);
      }
    } catch (err) {
      console.error('Import error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Error saving spreadsheet to Google Sheets.';
      setUploadError(errMsg);
      showToast(errMsg, true);
    } finally {
      setUploading(false);
    }
  };

  const handleResetUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    setPreviewData(null);
    setUploadError(null);
    setAnalyzingFile(false);
    setIsDragging(false);
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

            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <FileUp className="w-4 h-4 text-indigo-400" />
              <span>Import .xlsx</span>
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

      {/* Upload Spreadsheet Modal with Preview & Confirmation */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Import Excel Audit Workbook
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preview and validate laboratory schema before saving to Google Sheets
                  </p>
                </div>
              </div>
              <button 
                onClick={handleResetUploadModal} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {uploadError && (
              <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Validation Error</span>
                </div>
                <p className="leading-relaxed text-rose-200/90">{uploadError}</p>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewData(null); setUploadError(null); }}
                  className="text-indigo-300 hover:text-indigo-200 underline font-semibold text-[11px] block pt-1"
                >
                  Choose a different file
                </button>
              </div>
            )}

            {/* State 1: Analyzing Loading Indicator */}
            {analyzingFile && (
              <div className="py-12 px-6 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-indigo-500/30">
                <RefreshCw className="w-9 h-9 text-indigo-400 animate-spin mx-auto" />
                <div className="text-sm font-bold text-white">Analyzing & Validating Spreadsheet...</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Inspecting worksheets, verifying equipment schema columns, and parsing records...
                </p>
              </div>
            )}

            {/* State 2: File Dropzone (Visible when no file selected or file error) */}
            {!analyzingFile && !previewData && (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 ${
                  isDragging 
                    ? 'border-indigo-400 bg-indigo-950/20 scale-[0.99]' 
                    : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="dashboardExcelInput"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Click to browse or drag & drop .xlsx file
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      Supports AI&DS Laboratory audit workbook (SWL, CL-II/AR-VR, DSL, AIL, OSL, PL)
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Validates schema before saving to Google Sheets</span>
                  </div>
                </div>
              </div>
            )}

            {/* State 3: Validated Preview Details (Preview step before confirmation) */}
            {!analyzingFile && previewData && previewData.isValid && (
              <div className="space-y-4">
                {/* File Header Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[240px]">
                        {previewData.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(previewData.fileSizeBytes / 1024).toFixed(1)} KB • {previewData.sheetsCount} sheets
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Schema Valid</span>
                  </span>
                </div>

                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
                    <span className="text-xl font-black text-white">{previewData.totalRecords}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Working Units</span>
                    <span className="text-xl font-black text-emerald-300">{previewData.workingRecords}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">Faulty Units</span>
                    <span className="text-xl font-black text-rose-300">{previewData.faultyRecords}</span>
                  </div>
                </div>

                {/* Detected Labs Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    Detected Laboratories ({previewData.detectedLabsCount})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {previewData.labs.map((lab, i) => (
                      <div 
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center gap-1.5"
                      >
                        <span className="font-bold text-indigo-300">{lab.code}</span>
                        <span className="text-slate-400">({lab.systemsCount} systems)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explicit Safety Notice */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Google Sheets and the public dashboard will only update after you click <strong>Confirm Import</strong> below.
                  </span>
                </div>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetUploadModal}
                disabled={uploading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {previewData ? 'Cancel' : 'Close'}
              </button>

              {previewData && previewData.isValid && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing to Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Import to Google Sheets</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
