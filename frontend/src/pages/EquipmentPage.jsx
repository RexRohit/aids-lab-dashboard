import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchEquipment } from '../services/api';
import EquipmentTable from '../components/EquipmentTable';
import { RefreshCw, Monitor, Filter } from 'lucide-react';

export default function EquipmentPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [equipmentData, setEquipmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState('all');

  useEffect(() => {
    async function loadAllEquipment() {
      try {
        setLoading(true);
        const res = await fetchEquipment();
        if (res.success) {
          setEquipmentData(res.data);
        }
      } catch (err) {
        console.error('Failed to load equipment list:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllEquipment();
  }, []);

  const filteredByLab = selectedLab === 'all'
    ? equipmentData
    : equipmentData.filter(item => item.labCode.toLowerCase() === selectedLab.toLowerCase());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Gathering cross-laboratory equipment records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Monitor className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Master Equipment Database
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Department Asset Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, and inspect systems across all AI & DS laboratories
          </p>
        </div>

        {/* Lab Filter Select */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Lab:</span>
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Department Labs (6)</option>
            <option value="swl">Software Lab (SWL - 202)</option>
            <option value="ar-vr">AR/VR Lab (AR/VR - 234)</option>
            <option value="dsl">Data Science Lab (DSL - 235)</option>
            <option value="ail">AI Lab (AIL - 236)</option>
            <option value="osl">Operating Systems Lab (OSL - 238)</option>
            <option value="pl">Programming Lab (PL - 239)</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <EquipmentTable 
        equipment={filteredByLab}
        title="Department Equipment Audit Log"
        showLabColumn={true}
      />
    </div>
  );
}
