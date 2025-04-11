import React, { useContext } from 'react';
import { DietContext } from './DietContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

function getTodayDate(): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone }).format(now);
    const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone }).format(now);
    const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(now);

    return `${year}-${month}-${day}`;
}

const DatabasePage: React.FC = () => {
    const dietContext = useContext(DietContext);
    
    if (!dietContext) {
        throw new Error('DatabasePage must be used within a DietProvider');
    }
    
    const { database, removeFoodFromDatabase, addFoodEntryToDailyDiet } = dietContext;

    const handleFoodClick = (foodName: string): void => {
        console.log(getTodayDate());
        const foodDetails = { ...database[foodName], name: foodName, id: database[foodName].id };
        console.log(foodDetails);
        addFoodEntryToDailyDiet(foodDetails, getTodayDate());
    };

    return (
        <div className="w-full">
            <h2 className="mt-0 mb-4 text-xl font-semibold">Food Database</h2>
            <div className="w-full overflow-hidden">
                <table className="w-full table-fixed border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50 w-full table table-fixed">
                        <tr>
                            <th className="w-[30%] p-2 text-left font-bold">Food</th>
                            <th className="w-[20%] p-2 text-right font-bold">Protein</th>
                            <th className="w-[20%] p-2 text-right font-bold">Calories</th>
                            <th className="w-[20%] p-2 text-left font-bold">Unit</th>
                            <th className="w-[10%] p-2"></th>
                        </tr>
                    </thead>
                    <tbody className="block max-h-[65vh] overflow-y-auto">
                        {Object.entries(database).map(([foodName, foodDetails]) => (
                            <tr 
                                key={foodName} 
                                className="w-full table table-fixed hover:bg-gray-50 cursor-pointer group"
                                onClick={() => handleFoodClick(foodName)}
                            >
                                <td className="w-[30%] p-2 truncate">{foodName}</td>
                                <td className="w-[20%] p-2 text-right truncate">{foodDetails.protein}</td>
                                <td className="w-[20%] p-2 text-right truncate">{foodDetails.calories}</td>
                                <td className="w-[20%] p-2 truncate">{foodDetails.unit}</td>
                                <td className="w-[10%] p-2">
                                    <FontAwesomeIcon 
                                        className="invisible group-hover:visible text-red-500" 
                                        icon={faTrash} 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            removeFoodFromDatabase(foodName); 
                                        }} 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DatabasePage; 