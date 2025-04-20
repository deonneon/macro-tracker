import React, { useContext } from 'react';
import { Food } from '../DietContext';
import { DietContext } from '../DietContext';

interface FoodDatabaseSidebarProps {
  database: { [key: string]: Food };
}

// Helper to get today's date in YYYY-MM-DD
const getTodayDate = (): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone }).format(now);
  const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone }).format(now);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(now);
  return `${year}-${month}-${day}`;
};

const FoodDatabaseSidebar: React.FC<FoodDatabaseSidebarProps> = ({ database }) => {
  const dietContext = useContext(DietContext);
  const foodNames = Object.keys(database);

  if (!dietContext) {
    throw new Error('FoodDatabaseSidebar must be used within a DietProvider');
  }

  const { addFoodEntryToDailyDiet } = dietContext;

  const handleFoodClick = async (name: string) => {
    const food = database[name];
    if (!food) return;
    await addFoodEntryToDailyDiet({ ...food, name }, getTodayDate());
  };

  return (
    <aside
      className="h-full bg-white p-2 flex flex-col w-full"
      aria-label="Food Database Sidebar"
      tabIndex={0}
    >
      <h2 className="text-md font-semibold text-gray-800 px-1 flex-shrink-0 mt-4 mb-2" tabIndex={0} aria-label="Food Database">Food Database</h2>
      <div className="border-t border-gray-100 mb-2 flex-shrink-0"></div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <ul className="space-y-1" role="list">
          {foodNames.length === 0 ? (
            <li className="text-gray-500 text-xs px-1" aria-label="No foods in database">No foods in database.</li>
          ) : (
            foodNames.map((name) => {
              const food = database[name];
              return (
                <li
                  key={name}
                  className="flex flex-col gap-0.5 p-1.5 rounded hover:bg-blue-50 focus:bg-blue-100 cursor-pointer outline-none"
                  tabIndex={0}
                  aria-label={`Food: ${name}`}
                  role="listitem"
                  onClick={() => handleFoodClick(name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFoodClick(name);
                    }
                  }}
                >
                  <span className="font-medium text-xs text-gray-900">{name}</span>
                  <span className="text-xs text-gray-600">
                    Protein: {food.protein}g | {food.calories} cal | {food.serving_size}{food.unit}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </aside>
  );
};

export default FoodDatabaseSidebar; 