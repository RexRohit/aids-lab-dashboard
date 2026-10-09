import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import { useAuditData } from './hooks/useAuditData';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import LabPage from './pages/LabPage';
import EquipmentPage from './pages/EquipmentPage';
import ReportsPage from './pages/ReportsPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminExcelEditor from './pages/AdminExcelEditor';

// Layout wrapper for Public Dashboard views
function PublicLayout({ 
  isSidebarCollapsed, 
  toggleSidebar, 
  labStats, 
  isConnected, 
  formattedSyncTime, 
  refreshData, 
  children 
}) {
  return (
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
          {children}
        </main>
      </div>
    </div>
  );
}

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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Dashboard Routes */}
          <Route 
            path="/" 
            element={
              <PublicLayout
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                labStats={labStats}
                isConnected={isConnected}
                formattedSyncTime={formattedSyncTime}
                refreshData={refreshData}
              >
                <Dashboard 
                  summaryData={summaryData} 
                  loading={loading} 
                  error={error} 
                  refreshData={refreshData} 
                />
              </PublicLayout>
            } 
          />

          <Route 
            path="/lab/:id" 
            element={
              <PublicLayout
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                labStats={labStats}
                isConnected={isConnected}
                formattedSyncTime={formattedSyncTime}
                refreshData={refreshData}
              >
                <LabPage />
              </PublicLayout>
            } 
          />

          <Route 
            path="/equipment" 
            element={
              <PublicLayout
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                labStats={labStats}
                isConnected={isConnected}
                formattedSyncTime={formattedSyncTime}
                refreshData={refreshData}
              >
                <EquipmentPage />
              </PublicLayout>
            } 
          />

          <Route 
            path="/reports" 
            element={
              <PublicLayout
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                labStats={labStats}
                isConnected={isConnected}
                formattedSyncTime={formattedSyncTime}
                refreshData={refreshData}
              >
                <ReportsPage />
              </PublicLayout>
            } 
          />

          {/* Secure Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/excel" 
            element={
              <ProtectedRoute>
                <AdminExcelEditor />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* Real-time Socket Toast Notification across all views */}
        <NotificationToast 
          notification={syncNotification} 
          onClose={clearNotification} 
        />
      </Router>
    </AuthProvider>
  );
}
