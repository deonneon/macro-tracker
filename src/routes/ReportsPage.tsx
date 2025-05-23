import React, { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { MacroGoal } from '../types/goals';
import DateRangeSelector from '../components/reports/DateRangeSelector';
import MacroDistributionChart from '../components/reports/MacroDistributionChart';
import NutritionTrendChart from '../components/reports/NutritionTrendChart';
import StatisticalAnalysis from '../components/reports/StatisticalAnalysis';
import ExportConfigModal from '../components/ExportConfigModal';
import { useDailyEntriesByDateRange } from '../hooks/useDailyEntries';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

const ReportsPage: React.FC = () => {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    label: 'Last 7 Days'
  });
  
  // State for data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [macroGoal, setMacroGoal] = useState<MacroGoal | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  
  // Format dates for API
  const formattedStartDate = format(dateRange.startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(dateRange.endDate, 'yyyy-MM-dd');
  
  // Fetch data for the selected date range
  const { data: dailyEntries, isLoading: isLoadingEntries } = useDailyEntriesByDateRange(
    formattedStartDate,
    formattedEndDate
  );
  
  // Predefined date ranges
  const predefinedRanges = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        return { startDate: today, endDate: today, label: 'Today' };
      }
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const yesterday = subDays(new Date(), 1);
        return { startDate: yesterday, endDate: yesterday, label: 'Yesterday' };
      }
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        return {
          startDate: subDays(new Date(), 6),
          endDate: new Date(),
          label: 'Last 7 Days'
        };
      }
    },
    {
      label: 'This Week',
      getValue: () => {
        return {
          startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
          endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
          label: 'This Week'
        };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        return {
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
          label: 'This Month'
        };
      }
    }
  ];
  
  // Handle date range change
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };
  
  // Update loading state based on API loading state
  useEffect(() => {
    setIsLoading(isLoadingEntries);
  }, [isLoadingEntries]);
  
  // Fetch macro goals
  useEffect(() => {
    const fetchMacroGoal = async () => {
      try {
        const { goalsTable } = await import('../lib/supabase');
        const latestGoal = await goalsTable.getLatest();
        setMacroGoal(latestGoal);
      } catch (error) {
        console.error('Error fetching macro goal:', error);
      }
    };
    
    fetchMacroGoal();
  }, []);

  // Handle export button click
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };
  
  return (
    <div className="mx-auto sm:px-4 sm:py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Nutrition Reports & Analytics</h1>
        <button
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleOpenExportModal}
          aria-label="Export nutrition data"
          tabIndex={0}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Export Data
        </button>
      </div>
      
      {/* Date Range Selection */}
      <div className="mb-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>
        <DateRangeSelector 
          predefinedRanges={predefinedRanges}
          currentRange={dateRange}
          onRangeChange={handleDateRangeChange}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {!dailyEntries || dailyEntries.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-xl font-medium text-gray-700">No nutrition data available for the selected date range</h3>
              <p className="mt-2 text-gray-500">Try selecting a different date range or add food entries first.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Macro Distribution Section */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Macro Distribution</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <MacroDistributionChart data={dailyEntries} />
                  <StatisticalAnalysis 
                    data={dailyEntries} 
                    macroGoal={macroGoal}
                    dateRange={dateRange}
                  />
                </div>
              </div>
              
              {/* Trend Charts Section */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Nutrition Trends</h2>
                <NutritionTrendChart 
                  data={dailyEntries} 
                  macroGoal={macroGoal}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Modal */}
      <ExportConfigModal 
        isOpen={isExportModalOpen}
        onClose={handleCloseExportModal}
      />
    </div>
  );
};

export default ReportsPage; 