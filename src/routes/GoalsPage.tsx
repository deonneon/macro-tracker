import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import GoalSettingForm from '../components/GoalSettingForm';
import GoalsList from '../components/GoalsList';
import ConfirmationModal from '../components/ConfirmationModal';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';

const GoalsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [currentGoal, setCurrentGoal] = useState<MacroGoal | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    existingGoalId: '',
    pendingGoalData: {} as any
  });

  // For a personal app without authentication, we use a placeholder user ID
  const userId = '00000000-0000-0000-0000-000000000000';

  // Load the latest goal on initial render
  useEffect(() => {
    const fetchLatestGoal = async () => {
      try {
        const data = await goalsTable.getLatest();
        if (data) {
          setCurrentGoal(data);
        }
      } catch (err) {
        console.error('Error fetching latest goal:', err);
      }
    };

    fetchLatestGoal();
  }, []);

  const saveGoal = async (goalData: any, existingId?: string) => {
    try {
      console.log('Saving goal with data:', goalData);
      console.log('Existing ID (if updating):', existingId);
      
      let result;
      if (existingId) {
        // Update existing goal
        console.log(`Updating existing goal with ID ${existingId}`);
        result = await goalsTable.update(existingId, goalData);
      } else {
        // Create new goal
        console.log('Creating new goal');
        result = await goalsTable.create(goalData);
      }
      
      console.log('Goal saved successfully:', result);
      setCurrentGoal(result);
      setSuccess(true);
      setRefreshTrigger(prev => prev + 1); // Trigger list refresh
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving goal:', err);
      setError(err.message || 'Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('Form data submitted:', formData);
      
      // Calculate calories based on macros
      const calories = (formData.protein * 4) + (formData.carbs * 4) + (formData.fats * 9);
      
      // Map form fields to database fields (note 'fats' -> 'fat')
      const goalData = {
        calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fats, // Map 'fats' to 'fat'
        target_date: formData.date, // Store the target date
        user_id: userId
      };

      console.log('Processing goal with target date:', formData.date);
      
      // Check for existing goals on the same date
      let existingGoalId = currentGoal?.id;
      let needToCheckForExistingGoals = false;

      // If we're editing a goal but the date changed, treat it as a new goal for the new date
      if (existingGoalId && currentGoal?.target_date !== formData.date) {
        console.log('Date changed while editing, treating as new goal for new date');
        needToCheckForExistingGoals = true;
        existingGoalId = undefined;
      }

      // If we're not already editing a goal (or we changed the date), check for existing goals on this date
      if (!existingGoalId || needToCheckForExistingGoals) {
        console.log('Checking for existing goals on date:', formData.date);
        const existingGoals = await goalsTable.getByDate(formData.date, userId);
        console.log('Existing goals found:', existingGoals);
        
        if (existingGoals && existingGoals.length > 0) {
          // Use the most recent goal for this date
          const existingGoal = existingGoals[0];
          console.log(`Found existing goal for ${formData.date}:`, existingGoal);
          
          // Check if we're not trying to update the exact same goal
          if (existingGoal.id !== currentGoal?.id) {
            // Show confirmation modal
            setModalData({
              title: 'Goal Already Exists',
              message: `A goal already exists for ${formData.date}. Would you like to update it instead of creating a new one?`,
              existingGoalId: existingGoal.id,
              pendingGoalData: goalData
            });
            setShowModal(true);
            return;
          } else {
            console.log('Updating the same goal, no confirmation needed');
          }
        } else {
          console.log('No existing goals found for this date, creating new');
        }
      } else {
        console.log('Updating existing goal with ID:', existingGoalId);
      }
      
      // If no existing goal or we're updating the current goal, save directly
      await saveGoal(goalData, existingGoalId);
    } catch (err: any) {
      console.error('Error processing goal:', err);
      setError(err.message || 'Failed to process goal. Please try again.');
      setIsLoading(false);
    }
  };

  const handleModalConfirm = () => {
    // User confirmed to update existing goal
    setShowModal(false);
    saveGoal(modalData.pendingGoalData, modalData.existingGoalId);
  };

  const handleModalCancel = () => {
    // User wants to create a new goal
    setShowModal(false);
    saveGoal(modalData.pendingGoalData);
  };

  const handleCancel = () => {
    // Reset any form state or navigate back
    if (currentGoal?.id) {
      setCurrentGoal(null); // Clear current goal to create new one
    } else {
      console.log('Cancelled');
    }
  };

  const handleEditGoal = (goal: MacroGoal) => {
    console.log('Editing goal:', goal);
    setCurrentGoal(goal);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format the current goal for the form if it exists
  const formattedCurrentGoal = currentGoal 
    ? {
        protein: Number(currentGoal.protein),
        carbs: Number(currentGoal.carbs),
        fats: Number(currentGoal.fat), // Map 'fat' to 'fats' for the form
        date: currentGoal.target_date || format(new Date(), 'yyyy-MM-dd'), // Provide default date if undefined
      } 
    : undefined;

  const handleDeleteSuccess = () => {
    console.log('Goal deleted, refreshing list');
    setRefreshTrigger(prev => prev + 1);
    
    // If the deleted goal was the current goal, clear it
    if (currentGoal) {
      setCurrentGoal(null);
    }
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
            initialGoal={formattedCurrentGoal}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>

        <GoalsList 
          onEditGoal={handleEditGoal}
          currentGoalId={currentGoal?.id}
          refreshTrigger={refreshTrigger}
          onGoalsChanged={handleDeleteSuccess}
        />
        
        <ConfirmationModal
          isOpen={showModal}
          title={modalData.title}
          message={modalData.message}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      </div>
    </div>
  );
};

export default GoalsPage; 