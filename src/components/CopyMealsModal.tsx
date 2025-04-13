import React, { useState, useEffect, useContext } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { DietContext } from '../DietContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { dailyDietTable } from '../lib/supabase';

interface CopyMealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
}

interface FoodEntry {
  id: number;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  serving_size: number;
  unit: string;
  date: string;
  meal_type?: string;
  food_id: number;
  isSelected: boolean;
  modifiedServingSize?: number;
}

interface MealGroup {
  [mealType: string]: {
    entries: FoodEntry[];
    isAllSelected: boolean;
  };
}

const CopyMealsModal: React.FC<CopyMealsModalProps> = ({ isOpen, onClose, currentDate }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(subDays(new Date(), 1));
  const [groupedEntries, setGroupedEntries] = useState<MealGroup>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [servingSizeModifications, setServingSizeModifications] = useState<{[foodId: number]: number}>({});

  const dietContext = useContext(DietContext);
  
  if (!dietContext) {
    throw new Error('CopyMealsModal must be used within a DietProvider');
  }

  // Format the date to YYYY-MM-DD for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      
      // Don't allow selecting future dates beyond current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate > today) {
        return prevDate;
      }
      
      return newDate;
    });
  };

  // Handle date change from the input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : new Date();
    
    // Don't allow selecting future dates beyond current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate > today) {
      return;
    }
    
    setSelectedDate(newDate);
  };

  // Fetch food entries for the selected date
  useEffect(() => {
    const fetchFoodEntries = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const entries = await dailyDietTable.getByDate(formattedDate);
        
        // Group entries by meal type
        const mealGroups: MealGroup = {};
        
        entries.forEach(entry => {
          const mealType = entry.meal_type || "Snacks";
          
          if (!mealGroups[mealType]) {
            mealGroups[mealType] = { 
              entries: [],
              isAllSelected: false
            };
          }
          
          mealGroups[mealType].entries.push({
            ...entry,
            isSelected: false,
            serving_size: 1 // Default serving size
          });
        });
        
        setGroupedEntries(mealGroups);
      } catch (error) {
        console.error('Error fetching food entries:', error);
        setGroupedEntries({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodEntries();
  }, [formattedDate, isOpen]);

  // Handle individual food item selection
  const handleFoodSelect = (mealType: string, foodId: number) => {
    setGroupedEntries(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      // Update the isSelected state for the specific food item
      updatedGroups[mealType].entries = updatedGroups[mealType].entries.map(entry => 
        entry.id === foodId ? { ...entry, isSelected: !entry.isSelected } : entry
      );
      
      // Check if all items in this meal type are now selected
      updatedGroups[mealType].isAllSelected = updatedGroups[mealType].entries.every(entry => entry.isSelected);
      
      return updatedGroups;
    });
  };

  // Handle meal group selection
  const handleMealSelect = (mealType: string) => {
    setGroupedEntries(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      // Toggle the selection state for this meal type
      const newSelectionState = !updatedGroups[mealType].isAllSelected;
      
      // Update all food items in this meal type
      updatedGroups[mealType].entries = updatedGroups[mealType].entries.map(entry => ({
        ...entry,
        isSelected: newSelectionState
      }));
      
      // Update the meal type selection state
      updatedGroups[mealType].isAllSelected = newSelectionState;
      
      return updatedGroups;
    });
  };

  // Handle serving size modifications
  const handleServingSizeChange = (foodId: number, size: number) => {
    // Validate input
    if (size <= 0) return;
    
    // Update food entry with modified serving size
    setGroupedEntries(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      // Find and update the specific food item
      for (const mealType in updatedGroups) {
        updatedGroups[mealType].entries = updatedGroups[mealType].entries.map(entry => 
          entry.id === foodId ? { ...entry, modifiedServingSize: size } : entry
        );
      }
      
      return updatedGroups;
    });
  };

  // Reset serving size to original
  const handleResetServingSize = (foodId: number) => {
    setGroupedEntries(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      // Find and reset the specific food item
      for (const mealType in updatedGroups) {
        updatedGroups[mealType].entries = updatedGroups[mealType].entries.map(entry => 
          entry.id === foodId ? { ...entry, modifiedServingSize: undefined } : entry
        );
      }
      
      return updatedGroups;
    });
  };

  // Handle copy selected items
  const handleCopySelected = async () => {
    try {
      // Find all selected food entries
      const selectedEntries: FoodEntry[] = [];
      
      for (const mealType in groupedEntries) {
        groupedEntries[mealType].entries.forEach(entry => {
          if (entry.isSelected) {
            selectedEntries.push(entry);
          }
        });
      }
      
      if (selectedEntries.length === 0) return;
      
      // Copy each selected food entry to the current date
      for (const entry of selectedEntries) {
        await dietContext.addFoodEntryToDailyDiet(
          {
            id: entry.food_id,
            name: entry.name,
            protein: entry.protein,
            carbs: entry.carbs || 0,
            fat: entry.fat || 0,
            calories: entry.calories,
            serving_size: entry.modifiedServingSize || entry.serving_size,
            unit: entry.unit
          },
          currentDate,
          entry.meal_type
        );
      }
      
      // Close the modal after successful copy
      onClose();
    } catch (error) {
      console.error('Error copying meals:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Copy Meals from Previous Days</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPreviousDay}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Previous day"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2 flex-grow justify-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
              <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              <input 
                type="date" 
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select date"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <button 
              onClick={goToNextDay}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Next day"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : Object.keys(groupedEntries).length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-medium text-gray-600 mb-2">No entries for this day</h3>
              <p className="text-gray-500">
                Select a different day to see available meals.
              </p>
            </div>
          ) : (
            <div>
              {/* Column Headers */}
              <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider rounded-t-lg">
                <div className="col-span-1"></div>
                <div className="col-span-3">Food</div>
                <div className="col-span-1 text-center">Protein</div>
                <div className="col-span-1 text-center">Carbs</div>
                <div className="col-span-1 text-center">Fat</div>
                <div className="col-span-1 text-center">Calories</div>
                <div className="col-span-4 text-center">Serving Size</div>
              </div>

              {/* Meal Groups */}
              {Object.entries(groupedEntries).map(([mealType, { entries, isAllSelected }]) => (
                <div key={mealType} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                  {/* Meal Header */}
                  <div 
                    className="bg-blue-50 px-4 py-3 cursor-pointer flex items-center" 
                    onClick={() => handleMealSelect(mealType)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={() => handleMealSelect(mealType)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select all in ${mealType}`}
                    />
                    <h3 className="font-medium text-gray-700">{mealType}</h3>
                  </div>
                  
                  {/* Food Entries */}
                  <div className="divide-y divide-gray-100">
                    {entries.map(entry => (
                      <div key={entry.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center">
                        <div className="col-span-1">
                          <input 
                            type="checkbox" 
                            checked={entry.isSelected}
                            onChange={() => handleFoodSelect(mealType, entry.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            aria-label={`Select ${entry.name}`}
                          />
                        </div>
                        <div className="col-span-3">
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <div className="col-span-1 text-center">{entry.protein}g</div>
                        <div className="col-span-1 text-center">{entry.carbs || 0}g</div>
                        <div className="col-span-1 text-center">{entry.fat || 0}g</div>
                        <div className="col-span-1 text-center">{entry.calories}</div>
                        <div className="col-span-4 flex items-center justify-center space-x-2">
                          <input 
                            type="number" 
                            value={entry.modifiedServingSize !== undefined ? entry.modifiedServingSize : entry.serving_size}
                            onChange={(e) => handleServingSizeChange(entry.id, parseFloat(e.target.value))}
                            className="w-20 p-1 border border-gray-300 rounded text-center"
                            disabled={!entry.isSelected}
                            min="0.1"
                            step="0.1"
                          />
                          <span>{entry.unit}</span>
                          <button 
                            onClick={() => handleResetServingSize(entry.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                            disabled={!entry.isSelected || entry.modifiedServingSize === undefined}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button 
            onClick={handleCopySelected}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading || Object.values(groupedEntries).every(group => 
              group.entries.every(entry => !entry.isSelected)
            )}
          >
            Copy Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyMealsModal; 