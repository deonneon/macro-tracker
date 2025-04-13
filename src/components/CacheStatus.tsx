import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSync, faDatabase } from '@fortawesome/free-solid-svg-icons';

const CacheStatus: React.FC = () => {
  const queryClient = useQueryClient();
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get size of localStorage
  const calculateCacheSize = () => {
    try {
      const cacheKey = 'MACRO_TRACKER_QUERY_CACHE';
      const cacheData = localStorage.getItem(cacheKey);
      if (cacheData) {
        const sizeInBytes = new Blob([cacheData]).size;
        setCacheSize(sizeInBytes);
      } else {
        setCacheSize(0);
      }
    } catch (error) {
      console.error('Error calculating cache size:', error);
      setCacheSize(0);
    }
  };

  // Format bytes to a human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check for last refresh time
  useEffect(() => {
    calculateCacheSize();
    
    // Get the last refresh time from localStorage
    const lastRefreshTime = localStorage.getItem('MACRO_TRACKER_LAST_REFRESH');
    if (lastRefreshTime) {
      setLastRefresh(new Date(lastRefreshTime).toLocaleString());
    }
    
    // Update cache size and last refresh when cache changes
    const storageListener = () => {
      calculateCacheSize();
      const newRefreshTime = new Date().toISOString();
      localStorage.setItem('MACRO_TRACKER_LAST_REFRESH', newRefreshTime);
      setLastRefresh(new Date(newRefreshTime).toLocaleString());
    };
    
    window.addEventListener('storage', storageListener);
    
    return () => {
      window.removeEventListener('storage', storageListener);
    };
  }, []);

  // Clear the cache
  const handleClearCache = () => {
    try {
      queryClient.clear();
      localStorage.removeItem('MACRO_TRACKER_QUERY_CACHE');
      calculateCacheSize();
      setLastRefresh(null);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Refresh all data
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      const newRefreshTime = new Date().toISOString();
      localStorage.setItem('MACRO_TRACKER_LAST_REFRESH', newRefreshTime);
      setLastRefresh(new Date(newRefreshTime).toLocaleString());
      calculateCacheSize();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
        <FontAwesomeIcon icon={faDatabase} className="mr-2" />
        Cache Status
      </h3>
      
      <div className="space-y-2 text-gray-600 dark:text-gray-300">
        <p>Cache Size: {formatBytes(cacheSize)}</p>
        {lastRefresh && <p>Last Refreshed: {lastRefresh}</p>}
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button 
          onClick={handleClearCache}
          className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs flex items-center hover:bg-red-200 transition"
        >
          <FontAwesomeIcon icon={faTrash} className="mr-1" />
          Clear Cache
        </button>
        
        <button 
          onClick={handleRefreshData}
          disabled={isRefreshing}
          className={`bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs flex items-center hover:bg-blue-200 transition ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <FontAwesomeIcon icon={faSync} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default CacheStatus; 