import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';

interface GoalsListProps {
  onEditGoal: (goal: MacroGoal) => void;
  currentGoalId?: string;
  refreshTrigger?: number;
}

const GoalsList: React.FC<GoalsListProps> = ({ 
  onEditGoal, 
  currentGoalId,
  refreshTrigger = 0
}) => {
  const [goals, setGoals] = useState<MacroGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await goalsTable.getAll();
        if (error) throw error;
        
        setGoals(data || []);
      } catch (err: any) {
        console.error('Error fetching goals:', err);
        setError('Failed to load goals. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [refreshTrigger]);

  if (isLoading) {
    return <div className="text-center py-4">Loading goals...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No goals found. Create your first goal above.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Goal History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protein (g)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carbs (g)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat (g)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {goals.map((goal) => (
              <tr 
                key={goal.id} 
                className={`${goal.id === currentGoalId ? 'bg-indigo-50' : ''} hover:bg-gray-50`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(parseISO(goal.created_at), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {goal.protein}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {goal.carbs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {goal.fat}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {goal.calories}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEditGoal(goal)}
                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoalsList; 