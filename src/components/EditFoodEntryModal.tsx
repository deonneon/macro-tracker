import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { dailyDietTable } from '../lib/supabase';

interface EditFoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntry: any) => void;
  entry: {
    id: number;
    name: string;
    protein: number;
    carbs?: number;
    fat?: number;
    calories: number;
    meal_type?: string;
    serving_size?: number;
    unit: string;
  } | null;
}

const EditFoodEntryModal: React.FC<EditFoodEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entry
}) => {
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
    meal_type: 'Snacks',
    serving_size: 1,
    unit: 'g'
  });

  // Populate form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        id: entry.id,
        name: entry.name,
        protein: entry.protein,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
        calories: entry.calories,
        meal_type: entry.meal_type || 'Snacks',
        serving_size: entry.serving_size || 1,
        unit: entry.unit
      });
    }
  }, [entry]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['protein', 'carbs', 'fat', 'calories', 'serving_size'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry) return;
    
    try {
      // Save to database
      const updatedEntry = await dailyDietTable.update(entry.id, {
        name: formData.name,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat,
        calories: formData.calories,
        meal_type: formData.meal_type,
        serving_size: formData.serving_size,
        unit: formData.unit
      });
      
      onSave(updatedEntry);
      onClose();
    } catch (error) {
      console.error('Error updating food entry:', error);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Edit Food Entry</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
              tabIndex={0}
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Food Name (read-only) */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Food Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                    aria-label="Food name"
                  />
                </div>

                {/* Meal Type */}
                <div>
                  <label htmlFor="meal_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    id="meal_type"
                    name="meal_type"
                    value={formData.meal_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    aria-label="Meal type"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                {/* Serving Size */}
                <div>
                  <label htmlFor="serving_size" className="block text-sm font-medium text-gray-700 mb-1">
                    Serving Size
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="serving_size"
                      name="serving_size"
                      value={formData.serving_size}
                      onChange={handleChange}
                      min="0.1"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-l-md"
                      aria-label="Serving size"
                    />
                    <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                      {formData.unit}
                    </span>
                  </div>
                </div>

                {/* Macros - 2 columns grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Protein */}
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      id="protein"
                      name="protein"
                      value={formData.protein}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      aria-label="Protein in grams"
                    />
                  </div>

                  {/* Carbs */}
                  <div>
                    <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      id="carbs"
                      name="carbs"
                      value={formData.carbs}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      aria-label="Carbohydrates in grams"
                    />
                  </div>

                  {/* Fat */}
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      id="fat"
                      name="fat"
                      value={formData.fat}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      aria-label="Fat in grams"
                    />
                  </div>

                  {/* Calories */}
                  <div>
                    <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      id="calories"
                      name="calories"
                      value={formData.calories}
                      onChange={handleChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      aria-label="Calories"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Cancel editing"
                tabIndex={0}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Save changes"
                tabIndex={0}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFoodEntryModal; 