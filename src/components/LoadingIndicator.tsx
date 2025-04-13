import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

interface LoadingIndicatorProps {
  isLoading: boolean;
  isSuccess?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'inline' | 'overlay' | 'fixed';
  text?: string;
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  isSuccess = false,
  size = 'medium',
  position = 'inline',
  text,
  className = '',
}) => {
  // Don't render if not loading and not showing success
  if (!isLoading && !isSuccess) {
    return null;
  }

  // Size mapping
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl',
  };

  // Position/layout mapping
  const positionMap = {
    inline: 'inline-flex items-center',
    overlay: 'absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-800/70',
    fixed: 'fixed inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 z-50',
  };

  // Icon size mapping
  const iconSizeMap = {
    small: 'w-3 h-3',
    medium: 'w-5 h-5',
    large: 'w-8 h-8',
  };

  // Spacing mapping
  const spacingMap = {
    small: 'gap-1',
    medium: 'gap-2',
    large: 'gap-3',
  };

  return (
    <div 
      className={`${positionMap[position]} ${sizeMap[size]} ${spacingMap[size]} text-blue-600 dark:text-blue-400 ${className}`}
      role="status"
      aria-live="polite"
    >
      {isLoading ? (
        <FontAwesomeIcon
          icon={faSpinner}
          className={`${iconSizeMap[size]} animate-spin`}
          aria-hidden="true"
        />
      ) : (
        <FontAwesomeIcon
          icon={faCircleCheck}
          className={`${iconSizeMap[size]} text-green-600 dark:text-green-400`}
          aria-hidden="true"
        />
      )}
      
      {text && (
        <span className="ml-1">{text}</span>
      )}
      
      <span className="sr-only">
        {isLoading ? 'Loading...' : 'Success'}
      </span>
    </div>
  );
};

export default LoadingIndicator; 