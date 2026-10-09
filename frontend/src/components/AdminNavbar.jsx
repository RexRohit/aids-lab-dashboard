import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStatus } from '../services/api';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileSpreadsheet, 
  LogOut, 
  ExternalLink,
  Cloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AdminNavbar() {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();
  const [cloudStatus, setCloudStatus] = useState(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await getAdminStatus();
        if (res.success) {
          setCloudStatus(res.storage);
        }
      } catch (err) {
        console.error('Failed to fetch storage status:', err);
      }
    }
    loadStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isGoogleConfigured = cloudStatus?.googleSheetsConfigured;
  const isGoogleConnected = cloudStatus?.googleSheetsConnected;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide block leading-none">
                ADMIN CONSOLE
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5 block">
                AI & DS Lab Audit System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Control Panel</span>
            </NavLink>

            <NavLink
              to="/admin/excel"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet Editor</span>
            </NavLink>
          </nav>
        </div>

        {/* Right side controls & user */}
        <div className="flex items-center space-x-3">
          {/* Cloud Storage Status Badge */}
          <div
            className={`hidden lg:flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
              isGoogleConnected
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : isGoogleConfigured
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={
              isGoogleConnected
                ? `Google Sheets Connected: ${cloudStatus?.spreadsheetTitle || cloudStatus?.sheetId}`
                : isGoogleConfigured
                  ? 'Google Sheets configured but verifying connection'
                  : 'Running with local spreadsheet fallback. Add Google Sheets credentials in .env for cloud persistence.'
            }
          >
            <Cloud className="w-3.5 h-3.5 mr-1.5" />
            <span>
              {isGoogleConnected
                ? 'Google Sheets Persistent'
                : isGoogleConfigured
                  ? 'Google Sheets Configured'
                  : 'Local Storage Fallback'}
            </span>
          </div>

          {/* Link back to Public Dashboard */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            title="Open Live Public Dashboard in new tab"
          >
            <span>Public Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Admin User & Logout */}
          <div className="flex items-center pl-3 border-l border-slate-800 gap-2">
            <span className="hidden sm:inline-block text-xs font-bold text-slate-300">
              {adminUser?.username || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 transition-colors"
              title="Terminate Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
