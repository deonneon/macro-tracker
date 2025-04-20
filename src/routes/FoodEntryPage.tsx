import React, { useState } from 'react';
import FoodEntryForm from '../components/FoodEntryForm';
import DailyFoodEntryForm from '../components/DailyFoodEntryForm';
import DailyFoodLog from '../components/DailyFoodLog';

const FoodEntryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'database'>('log');
  const [activeLogTab, setActiveLogTab] = useState<'entry' | 'view'>('entry');

  return (
    <div className="mx-auto sm:px-4 md:px-20 sm:py-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('log')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'log'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-label="Daily food log tab"
            >
              Daily Food Log
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-label="Food database tab"
            >
              Food Database
            </button>
          </nav>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        {activeTab === 'log' ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800">Track Your Daily Food Intake</h2>
              <p className="text-sm text-gray-600 mt-2">
                Select foods from your database and log them with meal type and serving size.
              </p>
              
              {/* Sub-tabs for Food Log */}
              <div className="mt-4 flex border-b border-gray-200">
                <button
                  onClick={() => setActiveLogTab('entry')}
                  className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeLogTab === 'entry'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-label="Add food entry tab"
                >
                  Add Food Entry
                </button>
                <button
                  onClick={() => setActiveLogTab('view')}
                  className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeLogTab === 'view'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-label="View food log tab"
                >
                  View Food Log
                </button>
              </div>
            </div>
            
            {activeLogTab === 'entry' ? (
              <DailyFoodEntryForm />
            ) : (
              <DailyFoodLog />
            )}
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800">Add Foods to Your Database</h2>
              <p className="text-sm text-gray-600 mt-2">
                Add new foods to your personal database for easier tracking.
                Foods added here will be available when logging your daily food intake.
              </p>
            </div>
            <FoodEntryForm />
          </>
        )}
      </div>
    </div>
  );
};

export default FoodEntryPage; 