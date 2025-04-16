import React from 'react';
import { Food } from '../DietContext';

interface FoodDatabaseSidebarProps {
  database: { [key: string]: Food };
}

const FoodDatabaseSidebar: React.FC<FoodDatabaseSidebarProps> = ({ database }) => {
  const foodNames = Object.keys(database);

  return (
    <aside
      className="h-full bg-white p-2 flex flex-col"
      aria-label="Food Database Sidebar"
      tabIndex={0}
    >
      <h2 className="text-sm font-semibold mb-2 text-gray-800 px-1" tabIndex={0} aria-label="Food Database">Food Database</h2>
      <div className="border-t border-gray-100 mb-2"></div>
      <div className="flex-1 overflow-y-auto">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      // Optionally handle selection
                    }
                  }}
                >
                  <span className="font-medium text-xs text-gray-900">{name}</span>
                  <span className="text-xs text-gray-600">
                    P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g | 
                    {food.calories} cal | {food.serving_size}{food.unit}
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