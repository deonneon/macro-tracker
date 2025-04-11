import React, { useContext } from 'react';
import { DietContext } from './DietContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const DailyDietList: React.FC = () => {
    const dietContext = useContext(DietContext);
    
    if (!dietContext) {
        throw new Error('DailyDietList must be used within a DietProvider');
    }
    
    const { dailyDiet, removeFoodEntry } = dietContext;
    const reversedDailyDiet = [...dailyDiet].reverse();

    return (
        <div className='h-[35vh] overflow-auto w-full'>
            <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="text-left p-2 font-semibold">Date</th>
                        <th className="text-left p-2 font-semibold">Food</th>
                        <th className="text-right p-2 font-semibold">Protein</th>
                        <th className="text-right p-2 font-semibold">Calories</th>
                        <th className="text-left p-2 font-semibold">Unit</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {reversedDailyDiet.map((food, index) => (
                        <tr key={index} className="group border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">{food.date}</td>
                            <td className="p-2">{food.name}</td>
                            <td className="p-2 text-right">{food.protein}g</td>
                            <td className="p-2 text-right">{food.calories}</td>
                            <td className="p-2">{food.unit}</td>
                            <td className="p-2">
                                <FontAwesomeIcon 
                                    className="invisible group-hover:visible text-red-500 cursor-pointer" 
                                    icon={faTrash} 
                                    onClick={() => removeFoodEntry(dailyDiet.length - 1 - index)} 
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DailyDietList; 