import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import { useAuditData } from './hooks/useAuditData';

import Dashboard from './pages/Dashboard';
import LabPage from './pages/LabPage';
import EquipmentPage from './pages/EquipmentPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    summaryData,
    loading,
    error,
    isConnected,
    formattedSyncTime,
    syncNotification,
    clearNotification,
    refreshData
  } = useAuditData();

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const labStats = summaryData?.labStatus || [];

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        {/* Collapsible Sidebar */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
          labStats={labStats}
        />

        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
          {/* Header */}
          <Header
            isConnected={isConnected}
            formattedSyncTime={formattedSyncTime}
            onManualRefresh={refreshData}
            isCollapsed={isSidebarCollapsed}
          />

          {/* Page View Container */}
          <main className="p-6 max-w-7xl mx-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    summaryData={summaryData} 
                    loading={loading} 
                    error={error} 
                    refreshData={refreshData} 
                  />
                } 
              />
              <Route path="/lab/:id" element={<LabPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </main>
        </div>

        {/* Real-time Socket Toast Notification */}
        <NotificationToast 
          notification={syncNotification} 
          onClose={clearNotification} 
        />
      </div>
    </Router>
  );
}
