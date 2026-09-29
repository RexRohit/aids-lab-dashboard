import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export default function EquipmentTable({ 
  equipment = [], 
  title = "Equipment Audit Records",
  showLabColumn = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortField, setSortField] = useState('srNo');
  const [sortOrder, setSortOrder] = useState('asc');

  // Unique suppliers list for filter dropdown
  const suppliers = useMemo(() => {
    const list = new Set();
    equipment.forEach(item => {
      if (item.supplier) list.add(item.supplier);
    });
    return Array.from(list);
  }, [equipment]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return equipment
      .filter(item => {
        // Status filter
        if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        // Supplier filter
        if (supplierFilter !== 'all' && item.supplier !== supplierFilter) {
          return false;
        }

        // Search term
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          return (
            item.systemName.toLowerCase().includes(term) ||
            item.monitorSerial.toLowerCase().includes(term) ||
            item.cpuSerial.toLowerCase().includes(term) ||
            item.keyboardSerial.toLowerCase().includes(term) ||
            item.mouseSerial.toLowerCase().includes(term) ||
            item.deadStockNo.toLowerCase().includes(term) ||
            item.supplier.toLowerCase().includes(term) ||
            item.remarks.toLowerCase().includes(term)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? '';
        let valB = b[sortField] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [equipment, searchTerm, statusFilter, supplierFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Sr No', 'System', 'Lab', 'Monitor Serial', 'CPU Serial', 
      'Keyboard Serial', 'Mouse Serial', 'Status', 'Dead Stock No', 
      'Supplier', 'Purchase Date', 'Remarks'
    ];

    const rows = filteredItems.map(item => [
      item.srNo,
      item.systemName,
      item.labCode || '',
      item.monitorSerial,
      item.cpuSerial,
      item.keyboardSerial,
      item.mouseSerial,
      item.status,
      item.deadStockNo,
      item.supplier,
      item.purchaseDate,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lab_Audit_Equipment_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              {filteredItems.length} items
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit details parsed directly from Excel sheet
          </p>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial, system, stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Supplier Dropdown */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Status Pills */}
      <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Status:
        </span>

        {[
          { key: 'all', label: 'All Status' },
          { key: 'working', label: 'Working' },
          { key: 'faulty', label: 'Faulty' }
        ].map(pill => (
          <button
            key={pill.key}
            onClick={() => setStatusFilter(pill.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === pill.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="p-3.5 pl-5 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('srNo')}>
                <div className="flex items-center gap-1">
                  <span>Sr.</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              {showLabColumn && <th className="p-3.5">Lab</th>}
              <th className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('systemName')}>
                <div className="flex items-center gap-1">
                  <span>Computer / System</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5">Monitor Serial</th>
              <th className="p-3.5">CPU Serial</th>
              <th className="p-3.5">Keyboard Serial</th>
              <th className="p-3.5">Mouse Serial</th>
              <th className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5">Dead Stock No</th>
              <th className="p-3.5">Supplier</th>
              <th className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('purchaseDate')}>
                <div className="flex items-center gap-1">
                  <span>Purchase Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3.5 pr-5">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showLabColumn ? 12 : 11} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold">No equipment records found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isWorking = item.status.toLowerCase() === 'working';

                return (
                  <tr 
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-semibold text-slate-500 dark:text-slate-400">
                      {item.srNo}
                    </td>

                    {showLabColumn && (
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-[11px]">
                          {item.labCode || 'LAB'}
                        </span>
                      </td>
                    )}

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {item.systemName}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.monitorSerial}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.cpuSerial}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.keyboardSerial}
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.mouseSerial}
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                        isWorking 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {isWorking ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                      {item.deadStockNo}
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {item.supplier}
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {item.purchaseDate}
                    </td>

                    <td className="p-3.5 pr-5 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.remarks}>
                      {item.remarks}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
