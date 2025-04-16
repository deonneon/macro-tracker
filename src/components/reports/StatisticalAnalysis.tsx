import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { MacroGoal } from '../../types/goals';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface StatisticalAnalysisProps {
  data: any[];
  macroGoal: MacroGoal | null;
  dateRange: DateRange;
}

interface DailyTotals {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ 
  data, 
  macroGoal,
  dateRange 
}) => {
  // Group data by date to calculate daily totals
  const dailyTotals = useMemo(() => {
    const groupedByDate: Record<string, DailyTotals> = {};
    
    data.forEach(entry => {
      const date = entry.date;
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          protein: 0,
          carbs: 0,
          fat: 0,
          calories: 0
        };
      }
      
      groupedByDate[date].protein += entry.protein || 0;
      groupedByDate[date].carbs += entry.carbs || 0;
      groupedByDate[date].fat += entry.fat || 0;
      groupedByDate[date].calories += entry.calories || 0;
    });
    
    return Object.values(groupedByDate);
  }, [data]);
  
  // Calculate statistics
  const statistics = useMemo(() => {
    if (dailyTotals.length === 0) {
      return {
        protein: { avg: 0, min: 0, max: 0 },
        carbs: { avg: 0, min: 0, max: 0 },
        fat: { avg: 0, min: 0, max: 0 },
        calories: { avg: 0, min: 0, max: 0 }
      };
    }
    
    // Initial values from first entry
    let proteinMin = dailyTotals[0].protein;
    let proteinMax = dailyTotals[0].protein;
    let proteinSum = dailyTotals[0].protein;
    
    let carbsMin = dailyTotals[0].carbs;
    let carbsMax = dailyTotals[0].carbs;
    let carbsSum = dailyTotals[0].carbs;
    
    let fatMin = dailyTotals[0].fat;
    let fatMax = dailyTotals[0].fat;
    let fatSum = dailyTotals[0].fat;
    
    let caloriesMin = dailyTotals[0].calories;
    let caloriesMax = dailyTotals[0].calories;
    let caloriesSum = dailyTotals[0].calories;
    
    // Process the rest of the entries
    for (let i = 1; i < dailyTotals.length; i++) {
      const entry = dailyTotals[i];
      
      // Protein
      proteinMin = Math.min(proteinMin, entry.protein);
      proteinMax = Math.max(proteinMax, entry.protein);
      proteinSum += entry.protein;
      
      // Carbs
      carbsMin = Math.min(carbsMin, entry.carbs);
      carbsMax = Math.max(carbsMax, entry.carbs);
      carbsSum += entry.carbs;
      
      // Fat
      fatMin = Math.min(fatMin, entry.fat);
      fatMax = Math.max(fatMax, entry.fat);
      fatSum += entry.fat;
      
      // Calories
      caloriesMin = Math.min(caloriesMin, entry.calories);
      caloriesMax = Math.max(caloriesMax, entry.calories);
      caloriesSum += entry.calories;
    }
    
    const count = dailyTotals.length;
    
    return {
      protein: {
        avg: proteinSum / count,
        min: proteinMin,
        max: proteinMax
      },
      carbs: {
        avg: carbsSum / count,
        min: carbsMin,
        max: carbsMax
      },
      fat: {
        avg: fatSum / count,
        min: fatMin,
        max: fatMax
      },
      calories: {
        avg: caloriesSum / count,
        min: caloriesMin,
        max: caloriesMax
      }
    };
  }, [dailyTotals]);
  
  // Helper function to calculate goal percentage
  const calculateGoalPercentage = (value: number, goalValue: number | string | undefined) => {
    if (!goalValue) return null;
    const numericGoal = typeof goalValue === 'string' ? parseFloat(goalValue) : goalValue;
    return Math.round((value / numericGoal) * 100);
  };
  
  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-center">Statistical Analysis</h3>
      <p className="text-sm text-gray-500 mb-4 text-center">
        {format(dateRange.startDate, 'MMM d, yyyy')} to {format(dateRange.endDate, 'MMM d, yyyy')}
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left text-sm text-gray-600">Nutrient</th>
              <th className="p-2 text-center text-sm text-gray-600">Average</th>
              <th className="p-2 text-center text-sm text-gray-600">Minimum</th>
              <th className="p-2 text-center text-sm text-gray-600">Maximum</th>
              {macroGoal && <th className="p-2 text-center text-sm text-gray-600">Goal</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-2 font-medium">Protein</td>
              <td className="p-2 text-center">
                {statistics.protein.avg.toFixed(1)}g
                {macroGoal && (
                  <div className="text-xs text-gray-500">
                    {calculateGoalPercentage(statistics.protein.avg, macroGoal.protein)}% of goal
                  </div>
                )}
              </td>
              <td className="p-2 text-center">{statistics.protein.min.toFixed(1)}g</td>
              <td className="p-2 text-center">{statistics.protein.max.toFixed(1)}g</td>
              {macroGoal && <td className="p-2 text-center">{macroGoal.protein}g</td>}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-2 font-medium">Carbs</td>
              <td className="p-2 text-center">
                {statistics.carbs.avg.toFixed(1)}g
                {macroGoal && (
                  <div className="text-xs text-gray-500">
                    {calculateGoalPercentage(statistics.carbs.avg, macroGoal.carbs)}% of goal
                  </div>
                )}
              </td>
              <td className="p-2 text-center">{statistics.carbs.min.toFixed(1)}g</td>
              <td className="p-2 text-center">{statistics.carbs.max.toFixed(1)}g</td>
              {macroGoal && <td className="p-2 text-center">{macroGoal.carbs}g</td>}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-2 font-medium">Fat</td>
              <td className="p-2 text-center">
                {statistics.fat.avg.toFixed(1)}g
                {macroGoal && (
                  <div className="text-xs text-gray-500">
                    {calculateGoalPercentage(statistics.fat.avg, macroGoal.fat)}% of goal
                  </div>
                )}
              </td>
              <td className="p-2 text-center">{statistics.fat.min.toFixed(1)}g</td>
              <td className="p-2 text-center">{statistics.fat.max.toFixed(1)}g</td>
              {macroGoal && <td className="p-2 text-center">{macroGoal.fat}g</td>}
            </tr>
            <tr>
              <td className="p-2 font-medium">Calories</td>
              <td className="p-2 text-center">
                {Math.round(statistics.calories.avg)}
                {macroGoal && (
                  <div className="text-xs text-gray-500">
                    {calculateGoalPercentage(statistics.calories.avg, macroGoal.calories)}% of goal
                  </div>
                )}
              </td>
              <td className="p-2 text-center">{Math.round(statistics.calories.min)}</td>
              <td className="p-2 text-center">{Math.round(statistics.calories.max)}</td>
              {macroGoal && <td className="p-2 text-center">{macroGoal.calories}</td>}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-1"><strong>Note:</strong> Statistics are calculated based on daily totals.</p>
        <p>Data available for {dailyTotals.length} days in the selected period.</p>
      </div>
    </div>
  );
};

export default StatisticalAnalysis; 