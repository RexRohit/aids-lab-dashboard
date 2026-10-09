import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { 
  fetchAdminRecords, 
  batchSaveAdminLab, 
  deleteAdminRecord, 
  addAdminRecord, 
  updateAdminLabInfo, 
  previewAdminExcel,
  uploadAdminExcel,
  syncGoogleSheets 
} from '../services/api';
import socket from '../services/socket';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save, 
  Edit3, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  UploadCloud, 
  Cpu, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  Building2,
  FileUp,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export default function AdminExcelEditor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const labParam = searchParams.get('labId') || 'swl';

  const [activeLabId, setActiveLabId] = useState(labParam);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modified records tracking: { [recordId]: updatedRecordObject }
  const [dirtyRecords, setDirtyRecords] = useState({});

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editLabModalOpen, setEditLabModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form states
  const [newRecordForm, setNewRecordForm] = useState({
    itemType: 'Desktop PC',
    systemName: '',
    centralDeadStockNo: '',
    deptDeadStockNo: '',
    labDeadStockNo: '',
    supplier: '',
    monitorSerial: '',
    monitorStatus: 'YES',
    cpuSerial: '',
    cpuStatus: 'YES',
    purchaseDate: '',
    remarks: ''
  });

  const [labInfoForm, setLabInfoForm] = useState({
    name: '',
    room: '',
    inCharge: '',
    assistant: '',
    cost: '',
    area: '',
    os: '',
    tools: '',
    hardware: '',
    browsers: '',
    misc: ''
  });

  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  // Load records from backend
  const loadRecords = React.useCallback(async (keepDirty = false) => {
    try {
      setLoading(true);
      const res = await fetchAdminRecords('all');
      if (res.success) {
        setLabs(res.labs);
        if (!keepDirty) {
          setDirtyRecords({});
        }
      }
    } catch (err) {
      console.error('Failed to load admin records:', err);
      showToast('Failed to load spreadsheet records from server', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords(false);

    const handleExternalUpdate = (data) => {
      console.log('⚡ External update received in Spreadsheet Editor:', data);
    };

    socket.on('dashboard:updated', handleExternalUpdate);
    socket.on('excel-updated', handleExternalUpdate);

    return () => {
      socket.off('dashboard:updated', handleExternalUpdate);
      socket.off('excel-updated', handleExternalUpdate);
    };
  }, [loadRecords]);

  // Sync activeLabId with searchParam
  useEffect(() => {
    if (labParam && labParam !== activeLabId) {
      setActiveLabId(labParam);
    }
  }, [labParam]);

  const handleSelectLab = (labId) => {
    setActiveLabId(labId);
    setSearchParams({ labId });
  };

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Find current active lab
  const currentLab = useMemo(() => {
    return labs.find(l => l.id === activeLabId) || labs[0] || null;
  }, [labs, activeLabId]);

  // Initialize Lab Info Form when current lab changes
  useEffect(() => {
    if (currentLab) {
      setLabInfoForm({
        name: currentLab.name || '',
        room: currentLab.room || '',
        inCharge: currentLab.inCharge || '',
        assistant: currentLab.assistant || '',
        cost: currentLab.cost || '',
        area: currentLab.area || '',
        os: currentLab.os || '',
        tools: currentLab.tools || '',
        hardware: currentLab.hardware || '',
        browsers: currentLab.browsers || '',
        misc: currentLab.misc || ''
      });
    }
  }, [currentLab]);

  // Filter systems in current lab
  const currentSystems = useMemo(() => {
    if (!currentLab) return [];
    let items = currentLab.systems || [];

    // Apply dirty overrides locally
    items = items.map(sys => {
      if (dirtyRecords[sys.id]) {
        return { ...sys, ...dirtyRecords[sys.id] };
      }
      return sys;
    });

    if (statusFilter !== 'all') {
      items = items.filter(s => s.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(s =>
        (s.systemName && s.systemName.toLowerCase().includes(term)) ||
        (s.monitorSerial && s.monitorSerial.toLowerCase().includes(term)) ||
        (s.cpuSerial && s.cpuSerial.toLowerCase().includes(term)) ||
        (s.supplier && s.supplier.toLowerCase().includes(term)) ||
        (s.remarks && s.remarks.toLowerCase().includes(term)) ||
        (s.itemType && s.itemType.toLowerCase().includes(term))
      );
    }

    return items;
  }, [currentLab, dirtyRecords, statusFilter, searchTerm]);

  // Cell Edit Handler
  const handleCellChange = (systemId, field, value) => {
    const existingSys = currentLab.systems.find(s => s.id === systemId);
    if (!existingSys) return;

    const currentModified = dirtyRecords[systemId] || { ...existingSys };
    const updated = {
      ...currentModified,
      [field]: value
    };

    // Auto-update overall status if monitorStatus or cpuStatus changed
    if (field === 'monitorStatus' || field === 'cpuStatus' || field === 'remarks') {
      const monFaulty = /no|false|defective|faulty|issue|not working/i.test(updated.monitorStatus || '');
      const cpuFaulty = /no|false|defective|faulty|issue|not working/i.test(updated.cpuStatus || '');
      const remFaulty = /non-functional|faulty|damaged|not working|repair|failure|defect/i.test(updated.remarks || '');
      updated.status = (monFaulty || cpuFaulty || remFaulty) ? 'Faulty' : 'Working';
    }

    setDirtyRecords(prev => ({
      ...prev,
      [systemId]: updated
    }));
  };

  // Toggle Working / Faulty directly
  const handleToggleStatus = (systemId) => {
    const existingSys = currentLab.systems.find(s => s.id === systemId);
    if (!existingSys) return;

    const currentModified = dirtyRecords[systemId] || { ...existingSys };
    const newStatus = currentModified.status === 'Working' ? 'Faulty' : 'Working';
    const newMonStatus = newStatus === 'Working' ? 'YES' : 'NO';
    const newCpuStatus = newStatus === 'Working' ? 'YES' : 'NO';

    const updated = {
      ...currentModified,
      status: newStatus,
      monitorStatus: newMonStatus,
      cpuStatus: newCpuStatus
    };

    setDirtyRecords(prev => ({
      ...prev,
      [systemId]: updated
    }));
  };

  // Save all modified changes to Express -> Google Sheets -> Broadcast
  const handleSaveChanges = async () => {
    if (!currentLab) return;
    const dirtyCount = Object.keys(dirtyRecords).length;

    setSaving(true);
    try {
      // Merge current systems with dirty modifications
      const updatedSystems = (currentLab.systems || []).map(sys => {
        return dirtyRecords[sys.id] ? dirtyRecords[sys.id] : sys;
      });

      const res = await batchSaveAdminLab(currentLab.id, updatedSystems, labInfoForm);

      if (res.success) {
        showToast(`Successfully saved ${dirtyCount} record(s) to Google Sheets! Instant update broadcasted.`);
        setDirtyRecords({});
        await loadRecords(false);
      } else {
        showToast(res.error || 'Failed to save changes.', true);
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.response?.data?.error || err.message || 'Error saving changes to Google Sheets.', true);
    } finally {
      setSaving(false);
    }
  };

  // Add Record submit
  const handleAddRecordSubmit = async (e) => {
    e.preventDefault();
    if (!currentLab) return;

    try {
      setSaving(true);
      const res = await addAdminRecord(currentLab.id, newRecordForm);
      if (res.success) {
        showToast(`New record "${newRecordForm.systemName || 'System'}" added and synced to Google Sheets!`);
        setAddModalOpen(false);
        setNewRecordForm({
          itemType: 'Desktop PC',
          systemName: '',
          centralDeadStockNo: '',
          deptDeadStockNo: '',
          labDeadStockNo: '',
          supplier: '',
          monitorSerial: '',
          monitorStatus: 'YES',
          cpuSerial: '',
          cpuStatus: 'YES',
          purchaseDate: '',
          remarks: ''
        });
        await loadRecords(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to add record.', true);
    } finally {
      setSaving(false);
    }
  };

  // Delete Record submit
  const handleDeleteRecord = async (recordId) => {
    try {
      setSaving(true);
      const res = await deleteAdminRecord(recordId);
      if (res.success) {
        showToast('Record deleted and removed from Google Sheets!');
        setDeleteConfirmId(null);
        await loadRecords(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to delete record.', true);
    } finally {
      setSaving(false);
    }
  };

  // Save Lab Information & Specs
  const handleSaveLabInfo = async (e) => {
    e.preventDefault();
    if (!currentLab) return;

    try {
      setSaving(true);
      const res = await updateAdminLabInfo(currentLab.id, labInfoForm);
      if (res.success) {
        showToast(`Specifications for ${currentLab.code} updated and synced to Google Sheets!`);
        setEditLabModalOpen(false);
        await loadRecords(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to update lab info.', true);
    } finally {
      setSaving(false);
    }
  };

  // Handle file selection from input or drag-and-drop -> Trigger validation & preview
  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setUploadError('Only Excel spreadsheet files (.xlsx, .xls) are allowed.');
      setSelectedUploadFile(null);
      setPreviewData(null);
      return;
    }

    setSelectedUploadFile(file);
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

  // Confirm Import -> Commit to Google Sheets & broadcast via Socket.IO
  const handleConfirmImport = async () => {
    if (!selectedUploadFile) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('excelFile', selectedUploadFile);

      const res = await uploadAdminExcel(formData);
      if (res.success) {
        showToast(`Excel workbook "${selectedUploadFile.name}" successfully imported and synced to Google Sheets!`);
        setUploadModalOpen(false);
        setSelectedUploadFile(null);
        setPreviewData(null);
        setUploadError(null);
        await loadRecords(false);
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
    setSelectedUploadFile(null);
    setPreviewData(null);
    setUploadError(null);
    setAnalyzingFile(false);
    setIsDragging(false);
  };

  const dirtyCount = Object.keys(dirtyRecords).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminNavbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
          toastMessage.isError 
            ? 'bg-rose-950 border-rose-800 text-rose-200' 
            : 'bg-emerald-950 border-emerald-800 text-emerald-200'
        }`}>
          {toastMessage.isError ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar with Lab Tabs */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Excel Master Sheet Editor
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                Editable Audit Spreadsheet & Live Cloud Sync
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every saved edit updates Google Sheets and instantly recalculates metrics on public screens.
              </p>
            </div>

            {/* Action Buttons: Add, Lab Specs, Upload, SAVE */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Record</span>
              </button>

              <button
                onClick={() => setEditLabModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Lab Info & Specs</span>
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Upload and import Excel spreadsheet"
              >
                <FileUp className="w-4 h-4 text-indigo-400" />
                <span>Upload Spreadsheet</span>
              </button>

              {/* STICKY / PROMINENT SAVE BUTTON */}
              <button
                onClick={handleSaveChanges}
                disabled={saving || (dirtyCount === 0)}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xl transition-all ${
                  dirtyCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                    {dirtyCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black">
                        {dirtyCount} pending
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Laboratory Tabs Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-800 pt-4">
            {labs.map((lab) => {
              const isActive = lab.id === activeLabId;
              return (
                <button
                  key={lab.id}
                  onClick={() => handleSelectLab(lab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{lab.code} (Room {lab.room})</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {lab.systems ? lab.systems.length : 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search systems, serials, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status (Working & Faulty)</option>
                <option value="working">Working Only</option>
                <option value="faulty">Faulty Only</option>
              </select>

              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                Showing {currentSystems.length} records
              </span>
            </div>
          </div>
        </div>

        {/* Current Lab Information Bar */}
        {currentLab && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Facility Name</span>
                <span className="text-white font-bold">{currentLab.name}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">In-Charge</span>
                <span className="text-slate-200 font-semibold">{currentLab.inCharge}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assistant</span>
                <span className="text-slate-200 font-semibold">{currentLab.assistant}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Working: {currentLab.workingCount}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                Faulty: {currentLab.faultyCount}
              </span>
            </div>
          </div>
        )}

        {/* Editable Spreadsheet Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 pl-4 w-12 text-center">Sr</th>
                  <th className="p-3 w-40">System Name</th>
                  <th className="p-3 w-32">Type</th>
                  <th className="p-3 w-44">Monitor Serial</th>
                  <th className="p-3 w-28 text-center">Monitor W/F</th>
                  <th className="p-3 w-44">CPU Serial</th>
                  <th className="p-3 w-28 text-center">CPU W/F</th>
                  <th className="p-3 w-28 text-center">Overall</th>
                  <th className="p-3 w-40">Supplier</th>
                  <th className="p-3 w-48">Remarks</th>
                  <th className="p-3 pr-4 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {currentSystems.length > 0 ? (
                  currentSystems.map((item, idx) => {
                    const isDirty = Boolean(dirtyRecords[item.id]);

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isDirty ? 'bg-amber-950/20 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Sr No */}
                        <td className="p-2.5 pl-4 text-center text-slate-400 font-sans">
                          {item.srNo ?? idx + 1}
                        </td>

                        {/* System Name (Editable input) */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.systemName || ''}
                            onChange={(e) => handleCellChange(item.id, 'systemName', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-200 text-xs focus:outline-none"
                          />
                        </td>

                        {/* Item Type */}
                        <td className="p-2 text-slate-300 font-sans">
                          <input
                            type="text"
                            value={item.itemType || 'Desktop PC'}
                            onChange={(e) => handleCellChange(item.id, 'itemType', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-200 text-xs focus:outline-none"
                          />
                        </td>

                        {/* Monitor Serial */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.monitorSerial || ''}
                            onChange={(e) => handleCellChange(item.id, 'monitorSerial', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-200 text-[11px] focus:outline-none"
                          />
                        </td>

                        {/* Monitor Status (Toggle Button) */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = item.monitorStatus === 'YES' ? 'NO' : 'YES';
                              handleCellChange(item.id, 'monitorStatus', nextVal);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors ${
                              item.monitorStatus === 'YES'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.monitorStatus === 'YES' ? 'Working' : 'Faulty'}
                          </button>
                        </td>

                        {/* CPU Serial */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.cpuSerial || ''}
                            onChange={(e) => handleCellChange(item.id, 'cpuSerial', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-200 text-[11px] focus:outline-none"
                          />
                        </td>

                        {/* CPU Status (Toggle Button) */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = item.cpuStatus === 'YES' ? 'NO' : 'YES';
                              handleCellChange(item.id, 'cpuStatus', nextVal);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors ${
                              item.cpuStatus === 'YES'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.cpuStatus === 'YES' ? 'Working' : 'Faulty'}
                          </button>
                        </td>

                        {/* Overall Status (1-click Toggle) */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all shadow-sm ${
                              item.status === 'Working'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                            title="Click to toggle Overall Status"
                          >
                            {item.status}
                          </button>
                        </td>

                        {/* Supplier */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.supplier || ''}
                            onChange={(e) => handleCellChange(item.id, 'supplier', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-200 text-xs focus:outline-none"
                          />
                        </td>

                        {/* Remarks */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Add remark..."
                            value={item.remarks || ''}
                            onChange={(e) => handleCellChange(item.id, 'remarks', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded text-slate-300 text-xs focus:outline-none font-sans"
                          />
                        </td>

                        {/* Delete Action */}
                        <td className="p-2 pr-4 text-center">
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete this record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No records matched the filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Record Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Add Record to {currentLab?.code}</span>
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Item Type</label>
                  <select
                    value={newRecordForm.itemType}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, itemType: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Desktop PC">Desktop PC</option>
                    <option value="Projector">Projector</option>
                    <option value="Networks Switch">Networks Switch</option>
                    <option value="UPS">UPS</option>
                    <option value="IOT KIT">IOT KIT</option>
                    <option value="AR /VR Kit">AR /VR Kit</option>
                    <option value="Printer">Printer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">System Name / Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SYS-SWL-28"
                    value={newRecordForm.systemName}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, systemName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monitor Serial Number</label>
                  <input
                    type="text"
                    placeholder="Monitor S/N"
                    value={newRecordForm.monitorSerial}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, monitorSerial: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monitor Operational Status</label>
                  <select
                    value={newRecordForm.monitorStatus}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, monitorStatus: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="YES">YES (Working)</option>
                    <option value="NO">NO (Faulty)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">CPU Serial Number</label>
                  <input
                    type="text"
                    placeholder="CPU S/N"
                    value={newRecordForm.cpuSerial}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, cpuSerial: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">CPU Operational Status</label>
                  <select
                    value={newRecordForm.cpuStatus}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, cpuStatus: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="YES">YES (Working)</option>
                    <option value="NO">NO (Faulty)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RACCA INFOTECH"
                    value={newRecordForm.supplier}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, supplier: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Purchase Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 16/03/2026"
                    value={newRecordForm.purchaseDate}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, purchaseDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Remarks by Auditor</label>
                <input
                  type="text"
                  placeholder="Optional notes or fault remarks"
                  value={newRecordForm.remarks}
                  onChange={(e) => setNewRecordForm({ ...newRecordForm, remarks: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Adding Record...' : 'Confirm & Persist to Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Info & Specifications Modal */}
      {editLabModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <span>Edit {currentLab?.code} Information & Specifications</span>
              </h3>
              <button onClick={() => setEditLabModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLabInfo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Laboratory Name</label>
                  <input
                    type="text"
                    value={labInfoForm.name}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Room Number</label>
                  <input
                    type="text"
                    value={labInfoForm.room}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, room: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lab In-Charge Faculty</label>
                  <input
                    type="text"
                    value={labInfoForm.inCharge}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, inCharge: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Lab Assistant</label>
                  <input
                    type="text"
                    value={labInfoForm.assistant}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, assistant: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Total Lab Cost</label>
                  <input
                    type="text"
                    value={labInfoForm.cost}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, cost: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Area of Laboratory</label>
                  <input
                    type="text"
                    value={labInfoForm.area}
                    onChange={(e) => setLabInfoForm({ ...labInfoForm, area: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Operating Systems Installed</label>
                <input
                  type="text"
                  value={labInfoForm.os}
                  onChange={(e) => setLabInfoForm({ ...labInfoForm, os: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Programming Tools & Software</label>
                <input
                  type="text"
                  value={labInfoForm.tools}
                  onChange={(e) => setLabInfoForm({ ...labInfoForm, tools: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Hardware Configuration Specifications</label>
                <textarea
                  rows={3}
                  value={labInfoForm.hardware}
                  onChange={(e) => setLabInfoForm({ ...labInfoForm, hardware: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditLabModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save & Sync Specs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Equipment Record?</h3>
            <p className="text-xs text-slate-400">
              This record will be permanently removed from Google Sheets and dashboard statistics will automatically recalculate.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Spreadsheet Modal with Preview & Confirmation Workflow */}
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
                    Upload Audit Spreadsheet (.xlsx)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preview and validate workbook structure before persisting to Google Sheets
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
                  onClick={() => { setSelectedUploadFile(null); setPreviewData(null); setUploadError(null); }}
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
                  id="excelFileInputModal"
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
