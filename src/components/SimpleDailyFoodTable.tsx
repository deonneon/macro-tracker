import React from 'react';

export type FoodEntry = {
  id: number;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
};

interface SimpleDailyFoodTableProps {
  entries: FoodEntry[];
}

const SimpleDailyFoodTable: React.FC<SimpleDailyFoodTableProps> = ({ entries }) => {
  const dailyTotals = entries.reduce(
    (acc, entry) => ({
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
      calories: acc.calories + (entry.calories || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white rounded-lg shadow" aria-label="Daily Food Log Table">
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider">
            <th className="px-4 py-3 text-left" tabIndex={0} aria-label="Food">Food</th>
            <th className="px-4 py-3 text-center" tabIndex={0} aria-label="Protein (g)">Protein (g)</th>
            <th className="px-4 py-3 text-center" tabIndex={0} aria-label="Carbs (g)">Carbs (g)</th>
            <th className="px-4 py-3 text-center" tabIndex={0} aria-label="Fat (g)">Fat (g)</th>
            <th className="px-4 py-3 text-center" tabIndex={0} aria-label="Calories">Calories</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No food entries for this day.</td>
            </tr>
          ) : (
            entries.slice().reverse().map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 text-sm">
                <td className="px-4 py-2 font-medium" tabIndex={0} aria-label={entry.name}>{entry.name}</td>
                <td className="px-4 py-2 text-center" tabIndex={0} aria-label={`Protein: ${entry.protein}g`}>{entry.protein}g</td>
                <td className="px-4 py-2 text-center" tabIndex={0} aria-label={`Carbs: ${entry.carbs || 0}g`}>{entry.carbs || 0}g</td>
                <td className="px-4 py-2 text-center" tabIndex={0} aria-label={`Fat: ${entry.fat || 0}g`}>{entry.fat || 0}g</td>
                <td className="px-4 py-2 text-center" tabIndex={0} aria-label={`Calories: ${entry.calories}`}>{entry.calories}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-semibold text-sm">
            <td className="px-4 py-2">Daily Total</td>
            <td className="px-4 py-2 text-center">{dailyTotals.protein.toFixed(1)}g</td>
            <td className="px-4 py-2 text-center">{dailyTotals.carbs.toFixed(1)}g</td>
            <td className="px-4 py-2 text-center">{dailyTotals.fat.toFixed(1)}g</td>
            <td className="px-4 py-2 text-center">{dailyTotals.calories.toFixed(0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SimpleDailyFoodTable; 