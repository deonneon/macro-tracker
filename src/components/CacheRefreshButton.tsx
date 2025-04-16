import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { useQueryClient } from '@tanstack/react-query';
import LoadingIndicator from './LoadingIndicator';

interface CacheRefreshButtonProps {
  queryKey?: any;
  onRefresh?: () => Promise<void>;
  buttonText?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
}

const CacheRefreshButton: React.FC<CacheRefreshButtonProps> = ({
  queryKey,
  onRefresh,
  buttonText = 'Refresh Data',
  className = '',
  size = 'medium',
  iconOnly = false,
}) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Size mapping
  const sizeMap = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2',
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setShowSuccess(false);
    
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (queryKey) {
        // If a specific query key is provided, only invalidate that one
        await queryClient.invalidateQueries({ queryKey });
      } else {
        // Otherwise, invalidate all queries
        await queryClient.invalidateQueries();
      }
      
      // Show success indicator briefly
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`${sizeMap[size]} bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md flex items-center justify-center ${className} ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
        aria-label="Refresh data"
      >
        <FontAwesomeIcon 
          icon={faRotate} 
          className={`${isRefreshing ? 'animate-spin' : ''} ${!iconOnly ? 'mr-2' : ''}`} 
        />
        {!iconOnly && buttonText}
      </button>
      
      {showSuccess && !isRefreshing && (
        <LoadingIndicator 
          isLoading={false} 
          isSuccess={true} 
          size="small" 
          position="inline" 
          text="Updated" 
          className="ml-2" 
        />
      )}
    </div>
  );
};

export default CacheRefreshButton; 