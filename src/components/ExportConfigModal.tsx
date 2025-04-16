import React, { useState } from 'react';
import { ExportService, ExportOptions, ExportDataType, ExportFormat } from '../services/ExportService';
import { FileGenerationService } from '../services/FileGenerationService';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDataTypes, setSelectedDataTypes] = useState<ExportDataType[]>(['entries']);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Date presets for quick selection
  const datePresets = [
    { label: 'Last Week', startDate: getDateBefore(7), endDate: getTodayDate() },
    { label: 'Last Month', startDate: getDateBefore(30), endDate: getTodayDate() },
    { label: 'Last 3 Months', startDate: getDateBefore(90), endDate: getTodayDate() },
    { label: 'All Time', startDate: '', endDate: '' },
  ];

  // Helper function to get date X days ago in YYYY-MM-DD format
  function getDateBefore(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Handle data type checkbox change
  const handleDataTypeChange = (dataType: ExportDataType) => {
    if (selectedDataTypes.includes(dataType)) {
      setSelectedDataTypes(selectedDataTypes.filter(type => type !== dataType));
    } else {
      setSelectedDataTypes([...selectedDataTypes, dataType]);
    }
  };

  // Handle date preset selection
  const handleDatePresetSelect = (preset: { startDate: string; endDate: string }) => {
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  // Handle export button click
  const handleExport = async () => {
    // Validate at least one data type is selected
    if (selectedDataTypes.length === 0) {
      setError('Please select at least one data type to export');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare export options
      const exportOptions: ExportOptions = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        dataTypes: selectedDataTypes,
        format: exportFormat
      };

      // Generate export data
      const exportData = await ExportService.exportData(exportOptions);

      // Generate and download the file
      FileGenerationService.downloadFile({
        format: exportFormat,
        data: exportData
      });

      // Close the modal after successful export
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Export Nutrition Data</h2>
        
        {/* Format Selection */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Export Format</h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                aria-label="CSV format"
                tabIndex={0}
              />
              CSV
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
                aria-label="JSON format"
                tabIndex={0}
              />
              JSON
            </label>
          </div>
        </div>
        
        {/* Data Type Selection */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Data to Include</h3>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedDataTypes.includes('entries')}
                onChange={() => handleDataTypeChange('entries')}
                aria-label="Include food entries"
                tabIndex={0}
              />
              Food Entries
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedDataTypes.includes('foods')}
                onChange={() => handleDataTypeChange('foods')}
                aria-label="Include foods database"
                tabIndex={0}
              />
              Foods Database
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedDataTypes.includes('goals')}
                onChange={() => handleDataTypeChange('goals')}
                aria-label="Include macro goals"
                tabIndex={0}
              />
              Macro Goals
            </label>
          </div>
          {selectedDataTypes.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Please select at least one data type</p>
          )}
        </div>
        
        {/* Date Range Selection */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Date Range</h3>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
                tabIndex={0}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
                tabIndex={0}
              />
            </div>
          </div>
          
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            {datePresets.map((preset, index) => (
              <button
                key={index}
                className="bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm"
                onClick={() => handleDatePresetSelect(preset)}
                aria-label={`Select ${preset.label} date range`}
                tabIndex={0}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cancel export"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleExport}
            disabled={isLoading || selectedDataTypes.length === 0}
            aria-label="Export data"
            tabIndex={0}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportConfigModal; 