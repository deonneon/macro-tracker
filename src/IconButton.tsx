import React, { useContext } from 'react';
import { DietContext } from './DietContext';

function getTodayDate(): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone }).format(now);
    const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone }).format(now);
    const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(now);

    return `${year}-${month}-${day}`;
}

interface IconButtonProps {
    foodName: string;
    icon: string;
}

const IconButton: React.FC<IconButtonProps> = ({ foodName, icon }) => {
    const dietContext = useContext(DietContext);
    
    if (!dietContext) {
        throw new Error('IconButton must be used within a DietProvider');
    }
    
    const { database, dailyDiet, setDailyDiet } = dietContext;

    // Check if the food exists in the database
    const foodExists = database[foodName];

    // If the food doesn't exist, don't display anything
    if (!foodExists) return null;

    const handleButtonClick = (): void => {
        const foodDetails = database[foodName];
        setDailyDiet([...dailyDiet, { ...foodDetails, name: foodName, date: getTodayDate() }]);
    };

    return (
        <button 
            onClick={handleButtonClick}
            className="p-2 rounded-full flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title={`${foodExists.unit} of ${foodName}`}
            aria-label={`Add ${foodName} to daily diet`}
            tabIndex={0}
        >
            <img src={icon} alt={`${foodName} icon`} className="w-6 h-6" />
        </button>
    );
};

export default IconButton; 