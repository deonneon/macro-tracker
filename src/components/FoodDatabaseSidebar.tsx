import React from 'react';
import { Food } from '../DietContext';

interface FoodDatabaseSidebarProps {
  database: { [key: string]: Food };
}

const FoodDatabaseSidebar: React.FC<FoodDatabaseSidebarProps> = ({ database }) => {
  const foodNames = Object.keys(database);

  return (
    <aside
      className="w-full lg:w-80 xl:w-96 bg-white border-l border-gray-200 shadow-lg h-full max-h-[90vh] overflow-y-auto p-4 flex flex-col"
      aria-label="Food Database Sidebar"
      tabIndex={0}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-800" tabIndex={0} aria-label="Food Database">Food Database</h2>
      <ul className="flex-1 space-y-2" role="list">
        {foodNames.length === 0 ? (
          <li className="text-gray-500 text-sm" aria-label="No foods in database">No foods in database.</li>
        ) : (
          foodNames.map((name) => {
            const food = database[name];
            return (
              <li
                key={name}
                className="flex flex-col gap-1 p-2 rounded hover:bg-blue-50 focus:bg-blue-100 cursor-pointer outline-none"
                tabIndex={0}
                aria-label={`Food: ${name}`}
                role="listitem"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    // Optionally handle selection
                  }
                }}
              >
                <span className="font-medium text-gray-900">{name}</span>
                <span className="text-xs text-gray-600">
                  Protein: {food.protein}g | Carbs: {food.carbs}g | Fat: {food.fat}g | Calories: {food.calories} | Serving: {food.serving_size} {food.unit}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
};

export default FoodDatabaseSidebar; 