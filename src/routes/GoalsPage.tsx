import React, { useState} from 'react';
import GoalSettingForm from '../components/GoalSettingForm';
import { goalsTable } from '../lib/supabase';

const GoalsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // For a personal app without authentication, we use a placeholder user ID
  const userId = '00000000-0000-0000-0000-000000000000';

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Calculate calories based on macros
      const calories = (formData.protein * 4) + (formData.carbs * 4) + (formData.fats * 9);
      
      // Map form fields to database fields (note 'fats' -> 'fat')
      const goalData = {
        calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fats, // Map 'fats' to 'fat'
        user_id: userId
      };

      console.log('Saving goal:', goalData);
      
      // Save to Supabase
      const result = await goalsTable.create(goalData);
      console.log('Goal saved successfully:', result);
      setSuccess(true);
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset any form state or navigate back
    console.log('Cancelled');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Macro Goals</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            Goal saved successfully!
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow">
          <GoalSettingForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>

        {/* TODO: Add goals list component here in subtask 4 */}
      </div>
    </div>
  );
};

export default GoalsPage; 