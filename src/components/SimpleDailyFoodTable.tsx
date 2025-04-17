import React, { useContext } from 'react';
import { DietContext } from '../DietContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

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

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone }).format(now);
  const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone }).format(now);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(now);
  return `${year}-${month}-${day}`;
};

const SimpleDailyFoodTable: React.FC<SimpleDailyFoodTableProps> = ({ entries }) => {
  const dietContext = useContext(DietContext);

  const handleAddFood = async (entry: FoodEntry) => {
    if (!dietContext) return;
    const { database, addFoodEntryToDailyDiet } = dietContext;
    const dbFood = database[entry.name];
    if (!dbFood) {
      alert(`Food '${entry.name}' not found in database. Cannot add.`);
      return;
    }
    try {
      await addFoodEntryToDailyDiet(
        {
          ...dbFood,
          name: entry.name,
          protein: dbFood.protein,
          carbs: dbFood.carbs,
          fat: dbFood.fat,
          calories: dbFood.calories,
          serving_size: dbFood.serving_size,
          unit: dbFood.unit,
        },
        getTodayDate()
      );
    } catch (error) {
      // Optionally handle error (e.g., show toast)
      // eslint-disable-next-line no-console
      console.error('Failed to add food entry:', error);
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, entry: FoodEntry) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddFood(entry);
    }
  };

  const handleDeleteFood = async (reversedIdx: number) => {
    if (!dietContext) return;
    const index = entries.length - 1 - reversedIdx;
    if (index < 0 || !dietContext.removeFoodEntry) return;
    try {
      await dietContext.removeFoodEntry(index);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete food entry:', error);
    }
  };

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
            <th className="px-4 py-3 text-center" aria-label="Delete"></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No food entries for this day.</td>
            </tr>
          ) : (
            entries.slice().reverse().map((entry, idx) => (
              <tr
                key={entry.id}
                className="group hover:bg-blue-50 cursor-pointer text-sm focus:bg-blue-100 outline-none transition-colors"
                tabIndex={0}
                aria-label={`Add ${entry.name} to today`}
                onClick={() => handleAddFood(entry)}
                onKeyDown={(e) => handleRowKeyDown(e, entry)}
                role="button"
              >
                <td className="px-4 py-2 font-medium">{entry.name}</td>
                <td className="px-4 py-2 text-center">{entry.protein}g</td>
                <td className="px-4 py-2 text-center">{entry.carbs || 0}g</td>
                <td className="px-4 py-2 text-center">{entry.fat || 0}g</td>
                <td className="px-4 py-2 text-center">{entry.calories}</td>
                <td className="px-2 py-2 text-center">
                  <span
                    className="invisible group-hover:visible group-focus-within:visible text-red-500 cursor-pointer"
                    tabIndex={0}
                    aria-label={`Delete ${entry.name} from today`}
                    role="button"
                    onClick={(e: React.MouseEvent<HTMLSpanElement>) => { e.stopPropagation(); handleDeleteFood(idx); }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteFood(idx);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </span>
                </td>
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
            <td className="px-4 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SimpleDailyFoodTable; 