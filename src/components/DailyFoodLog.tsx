import React, { useState, useEffect, useContext } from 'react';
import { DietContext } from '../DietContext';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { dailyDietTable } from '../lib/supabase';
import EditFoodEntryModal from './EditFoodEntryModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Interface for food entries grouped by meal type
interface MealGroup {
  [mealType: string]: {
    entries: {
      id: number;
      name: string;
      protein: number;
      carbs: number | undefined;
      fat: number | undefined;
      calories: number;
      serving_size: number;
      unit: string;
      date: string;
      meal_type?: string;
    }[];
    totals: {
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
    };
  };
}

const DailyFoodLog: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupedEntries, setGroupedEntries] = useState<MealGroup>({});
  
  // State for edit and delete modals
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const dietContext = useContext(DietContext);
  
  if (!dietContext) {
    throw new Error('DailyFoodLog must be used within a DietProvider');
  }
  
  const { removeFoodEntry } = dietContext;

  // Format the date to YYYY-MM-DD for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  // Handle date change from the input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : new Date();
    setSelectedDate(newDate);
  };

  // Open edit modal for a food entry
  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  // Open delete confirmation modal for a food entry
  const handleDeleteClick = (entry: any) => {
    setSelectedEntry(entry);
    setDeleteModalOpen(true);
  };

  // Handle food entry update after editing
  const handleUpdateEntry = (updatedEntry: any) => {
    // Update the food entries list
    setFoodEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
      )
    );
  };

  // Handle food entry deletion
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    
    try {
      await dailyDietTable.delete(selectedEntry.id);
      setFoodEntries(prevEntries => prevEntries.filter(entry => entry.id !== selectedEntry.id));
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting food entry:', error);
    }
  };

  // Fetch food entries for the selected date
  useEffect(() => {
    const fetchFoodEntries = async () => {
      setIsLoading(true);
      try {
        const entries = await dailyDietTable.getByDate(formattedDate);
        setFoodEntries(entries);
      } catch (error) {
        console.error('Error fetching food entries:', error);
        setFoodEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodEntries();
  }, [formattedDate]);

  // Group entries by meal type and calculate totals
  useEffect(() => {
    const mealGroups: MealGroup = {
      Breakfast: { entries: [], totals: { protein: 0, carbs: 0, fat: 0, calories: 0 } },
      Lunch: { entries: [], totals: { protein: 0, carbs: 0, fat: 0, calories: 0 } },
      Dinner: { entries: [], totals: { protein: 0, carbs: 0, fat: 0, calories: 0 } },
      Snacks: { entries: [], totals: { protein: 0, carbs: 0, fat: 0, calories: 0 } }
    };

    foodEntries.forEach(entry => {
      // Default to "Snacks" if no meal type is specified
      const mealType = entry.meal_type || "Snacks";
      
      if (!mealGroups[mealType]) {
        mealGroups[mealType] = { 
          entries: [], 
          totals: { protein: 0, carbs: 0, fat: 0, calories: 0 } 
        };
      }
      
      mealGroups[mealType].entries.push(entry);
      mealGroups[mealType].totals.protein += entry.protein || 0;
      mealGroups[mealType].totals.carbs += entry.carbs || 0;
      mealGroups[mealType].totals.fat += entry.fat || 0;
      mealGroups[mealType].totals.calories += entry.calories || 0;
    });

    setGroupedEntries(mealGroups);
  }, [foodEntries]);

  // Calculate daily totals across all meal types
  const dailyTotals = Object.values(groupedEntries).reduce(
    (acc, mealGroup) => {
      return {
        protein: acc.protein + mealGroup.totals.protein,
        carbs: acc.carbs + mealGroup.totals.carbs,
        fat: acc.fat + mealGroup.totals.fat,
        calories: acc.calories + mealGroup.totals.calories
      };
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Date Selector */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
        <button 
          onClick={goToPreviousDay}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="Previous day"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goToPreviousDay()}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select date"
          />
        </div>
        
        <button 
          onClick={goToNextDay}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="Next day"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goToNextDay()}
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-gray-600" />
        </button>
      </div>

      {/* Column Headers */}
      <div className="bg-white rounded-t-lg shadow mb-px">
        <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider">
          <div className="col-span-4">Food</div>
          <div className="col-span-2 text-center">Protein (g)</div>
          <div className="col-span-2 text-center">Carbs (g)</div>
          <div className="col-span-2 text-center">Fat (g)</div>
          <div className="col-span-1 text-center">Calories</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

      {/* Food Log Content */}
      <div className="bg-white rounded-b-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        ) : foodEntries.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No entries for this day</h3>
            <p className="text-gray-500">
              Add food entries to your daily log to see them here.
            </p>
          </div>
        ) : (
          <div>
            {/* Meal Type Sections */}
            {Object.entries(groupedEntries).map(([mealType, { entries, totals }]) => 
              entries.length > 0 && (
                <div key={mealType} className="border-b border-gray-200 last:border-b-0">
                  <div className="bg-gray-50 px-4 py-3">
                    <h3 className="font-medium text-gray-700">{mealType}</h3>
                  </div>
                  
                  {/* Food Entries for This Meal */}
                  <div className="divide-y divide-gray-100">
                    {entries.map(entry => (
                      <div key={entry.id} className="grid grid-cols-12 px-4 py-3 text-sm hover:bg-gray-50">
                        <div className="col-span-4 flex items-center">
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <div className="col-span-2 text-center">{entry.protein}g</div>
                        <div className="col-span-2 text-center">{entry.carbs || 0}g</div>
                        <div className="col-span-2 text-center">{entry.fat || 0}g</div>
                        <div className="col-span-1 text-center">{entry.calories}</div>
                        <div className="col-span-1 flex justify-end space-x-2">
                          <button 
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditEntry(entry)}
                            aria-label={`Edit ${entry.name}`}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditEntry(entry)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(entry)}
                            aria-label={`Delete ${entry.name}`}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteClick(entry)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Meal Subtotals */}
                  <div className="bg-gray-100 px-4 py-2 grid grid-cols-12 text-sm font-medium">
                    <div className="col-span-4">Subtotal</div>
                    <div className="col-span-2 text-center">{totals.protein.toFixed(1)}g</div>
                    <div className="col-span-2 text-center">{totals.carbs.toFixed(1)}g</div>
                    <div className="col-span-2 text-center">{totals.fat.toFixed(1)}g</div>
                    <div className="col-span-2 text-center">{totals.calories.toFixed(0)} cal</div>
                  </div>
                </div>
              )
            )}
            
            {/* Daily Totals */}
            <div className="bg-blue-50 px-4 py-3 grid grid-cols-12 text-sm font-semibold">
              <div className="col-span-4">Daily Total</div>
              <div className="col-span-2 text-center">{dailyTotals.protein.toFixed(1)}g</div>
              <div className="col-span-2 text-center">{dailyTotals.carbs.toFixed(1)}g</div>
              <div className="col-span-2 text-center">{dailyTotals.fat.toFixed(1)}g</div>
              <div className="col-span-2 text-center">{dailyTotals.calories.toFixed(0)} cal</div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditFoodEntryModal 
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateEntry}
        entry={selectedEntry}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteEntry}
        itemName={selectedEntry?.name || ''}
      />
    </div>
  );
};

export default DailyFoodLog; 