import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { triggerRefresh } from '../services/api';

export default function Header({ 
  isConnected, 
  formattedSyncTime, 
  onManualRefresh,
  isCollapsed 
}) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await triggerRefresh();
      if (onManualRefresh) onManualRefresh();
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <header className={`sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300 px-6 flex items-center justify-between`}>
      {/* Left side title / breadcrumb */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
            AI&DS Laboratory Audit Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI&DS Lab Audit sheet 2026-27.xlsx</span>
          </p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        {/* Socket Connection Badge */}
        <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isConnected 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
        }`}>
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <Wifi className="w-3.5 h-3.5 mr-1" />
              <span>Live Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 mr-1" />
              <span>Connecting...</span>
            </>
          )}
        </div>

        {/* Last Synced Time */}
        <div className="flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-indigo-500 mr-1.5" />
          <span>Last synced: <span className="font-semibold text-slate-800 dark:text-slate-100">{formattedSyncTime}</span></span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          title="Force Excel Sync"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
        </button>

        {/* Light/Dark Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>
    </header>
  );
}
