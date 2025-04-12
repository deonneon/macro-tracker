import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Form specific interface (different from DB schema)
interface FormMacroGoal {
  protein: number;
  carbs: number;
  fats: number; // Note: In DB this is 'fat'
  date: string; // Note: Not stored in DB directly
}

interface GoalSettingFormProps {
  initialGoal?: FormMacroGoal;
  onSubmit: (goal: FormMacroGoal) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const GoalSettingForm: React.FC<GoalSettingFormProps> = ({
  initialGoal,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormMacroGoal>({
    protein: initialGoal?.protein || 0,
    carbs: initialGoal?.carbs || 0,
    fats: initialGoal?.fats || 0,
    date: initialGoal?.date || format(new Date(), 'yyyy-MM-dd'),
  });

  // Add effect to update form when initialGoal changes
  useEffect(() => {
    if (initialGoal) {
      console.log('Initial goal data updated:', initialGoal);
      setFormData({
        protein: initialGoal.protein || 0,
        carbs: initialGoal.carbs || 0,
        fats: initialGoal.fats || 0,
        date: initialGoal.date || format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [initialGoal]);

  const [calories, setCalories] = useState<number>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormMacroGoal, string>>>({});
  const [formValid, setFormValid] = useState(true);

  useEffect(() => {
    // Calculate calories whenever macros change
    const totalCalories = (formData.protein * 4) + (formData.carbs * 4) + (formData.fats * 9);
    setCalories(totalCalories);
  }, [formData.protein, formData.carbs, formData.fats]);

  // Check if form is valid
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    setFormValid(!hasErrors);
  }, [errors]);

  const validateField = (name: keyof FormMacroGoal, value: number | string): string => {
    if (name === 'date') {
      if (!value) return 'Date is required';
      return '';
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return 'Must be a number';
    if (numValue < 0) return 'Must be positive';
    if (numValue > 1000) return 'Value too high';
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormMacroGoal, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));

    setFormData(prev => ({
      ...prev,
      [name]: name === 'date' ? value : Number(value),
    }));
    
    // If date changes, log it
    if (name === 'date' && initialGoal && initialGoal.date !== value) {
      console.log(`Date changed from ${initialGoal.date} to ${value}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<Record<keyof FormMacroGoal, string>> = {};
    let hasErrors = false;
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof FormMacroGoal, value);
      if (error) {
        newErrors[key as keyof FormMacroGoal] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    console.log('Submitting form data:', formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {initialGoal ? 'Edit Macro Goals' : 'Set New Macro Goals'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
            Protein (g)
          </label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={formData.protein}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            max="1000"
            required
          />
          {errors.protein && (
            <p className="mt-1 text-sm text-red-600">{errors.protein}</p>
          )}
        </div>

        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
            Carbohydrates (g)
          </label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formData.carbs}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            max="1000"
            required
          />
          {errors.carbs && (
            <p className="mt-1 text-sm text-red-600">{errors.carbs}</p>
          )}
        </div>

        <div>
          <label htmlFor="fats" className="block text-sm font-medium text-gray-700">
            Fats (g)
          </label>
          <input
            type="number"
            id="fats"
            name="fats"
            value={formData.fats}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            max="1000"
            required
          />
          {errors.fats && (
            <p className="mt-1 text-sm text-red-600">{errors.fats}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Calories
          </label>
          <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 sm:text-sm">
            {calories.toFixed(0)} kcal
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formValid}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialGoal ? 'Update Goals' : 'Save Goals'}
        </button>
      </div>
    </form>
  );
};

export default GoalSettingForm; 