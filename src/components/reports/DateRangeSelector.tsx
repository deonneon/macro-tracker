import React, { useState } from 'react';
import { format } from 'date-fns';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface PredefinedRange {
  label: string;
  getValue: () => DateRange;
}

interface DateRangeSelectorProps {
  predefinedRanges: PredefinedRange[];
  currentRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  predefinedRanges,
  currentRange,
  onRangeChange
}) => {
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(currentRange.startDate, 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(currentRange.endDate, 'yyyy-MM-dd')
  );

  // Handle preset range selection
  const handlePresetRangeSelect = (preset: PredefinedRange) => {
    const newRange = preset.getValue();
    onRangeChange(newRange);
    setShowCustom(false);
  };

  // Handle custom range selection
  const handleCustomRangeSelect = () => {
    if (!customStartDate || !customEndDate) return;
    
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return;
    }
    
    // Ensure start date is before or equal to end date
    if (startDate > endDate) {
      return;
    }
    
    onRangeChange({
      startDate,
      endDate,
      label: 'Custom Range'
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-4">
        {predefinedRanges.map((range, index) => (
          <button
            key={index}
            onClick={() => handlePresetRangeSelect(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentRange.label === range.label
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Select ${range.label} date range`}
            tabIndex={0}
          >
            {range.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentRange.label === 'Custom Range'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Select custom date range"
          tabIndex={0}
        >
          Custom Range
        </button>
      </div>
      
      {showCustom && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                aria-label="Start date"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                aria-label="End date"
              />
            </div>
          </div>
          <button
            onClick={handleCustomRangeSelect}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Apply custom date range"
            tabIndex={0}
          >
            Apply Range
          </button>
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        Current range: <span className="font-medium">{format(currentRange.startDate, 'MMM d, yyyy')} - {format(currentRange.endDate, 'MMM d, yyyy')}</span>
      </div>
    </div>
  );
};

export default DateRangeSelector; 