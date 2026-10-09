import { useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';
import { fetchSummary } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export function useAuditData() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastSynced, setLastSynced] = useState(null);
  const [formattedSyncTime, setFormattedSyncTime] = useState('Recently');
  const [syncNotification, setSyncNotification] = useState(null);

  const loadSummaryData = useCallback(async (showToast = false, toastMessage = null) => {
    try {
      setLoading(true);
      const res = await fetchSummary();
      if (res.success) {
        setSummaryData(res.data);
        if (res.data.lastSynced) {
          setLastSynced(new Date(res.data.lastSynced));
        }
        setError(null);
        if (showToast) {
          setSyncNotification({
            id: Date.now(),
            message: toastMessage || 'Dashboard data updated from Excel / Google Sheets!'
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit summary data:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update relative time ("Last synced: X ago") every 5 seconds
  useEffect(() => {
    if (!lastSynced) return;

    const updateRelativeTime = () => {
      try {
        setFormattedSyncTime(`${formatDistanceToNow(lastSynced, { addSuffix: true })}`);
      } catch (e) {
        setFormattedSyncTime('Just now');
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 5000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  // Socket.IO event listener with auto-refetch on reconnect
  useEffect(() => {
    loadSummaryData(false);

    function onConnect() {
      setIsConnected(true);
      // Auto-refetch latest data when reconnected (crucial for Render sleeping service wakeup)
      loadSummaryData(false);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onDataUpdated(data) {
      console.log('⚡ Live update event received from backend:', data);
      if (data && data.timestamp) {
        setLastSynced(new Date(data.timestamp));
      }
      loadSummaryData(true, data?.message || 'Dashboard statistics updated live!');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('dashboard:updated', onDataUpdated);
    socket.on('excel-updated', onDataUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('dashboard:updated', onDataUpdated);
      socket.off('excel-updated', onDataUpdated);
    };
  }, [loadSummaryData]);

  const clearNotification = () => setSyncNotification(null);

  return {
    summaryData,
    loading,
    error,
    isConnected,
    lastSynced,
    formattedSyncTime,
    syncNotification,
    clearNotification,
    refreshData: () => loadSummaryData(true, 'Manual sync completed!')
  };
}
