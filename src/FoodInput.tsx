import React, { useState, useContext, useRef } from 'react';
import { DietContext } from './DietContext';
import AIQueryComponent from './AIQueryComponent';

function getTodayDate(): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone }).format(now);
    const month = new Intl.DateTimeFormat('en', { month: '2-digit', timeZone }).format(now);
    const day = new Intl.DateTimeFormat('en', { day: '2-digit', timeZone }).format(now);
    return `${year}-${month}-${day}`;
}

const isValidNumberOrBlank = (value: string): boolean => {
    return /^(\d+(\.\d+)?)?$/.test(value);
};

interface AIData {
    food_name: string;
    protein: string;
    calories: string;
    measurement: string;
}

const FoodInput: React.FC = () => {
    const dietContext = useContext(DietContext);
    
    if (!dietContext) {
        throw new Error('FoodInput must be used within a DietProvider');
    }
    
    const { database, setDatabase, dailyDiet, setDailyDiet, addFoodToDatabase } = dietContext;
    
    const [input, setInput] = useState<string>('');
    const [proteinInput, setProteinInput] = useState<string>('');
    const [calorieInput, setCalorieInput] = useState<string>('');
    const [unitInput, setUnitInput] = useState<string>('');
    const [matchingFoods, setMatchingFoods] = useState<string[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [showCancel, setShowCancel] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [hideAIResponse, setHideAIResponse] = useState<boolean>(false);
    const [aiDataReturned, setAIDataReturned] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const lowercasedValue = e.target.value ? e.target.value.toLowerCase() : '';
        setInput(lowercasedValue);
        if (lowercasedValue) {
            const matches = Object.keys(database).filter(food =>
                food.toLowerCase().includes(lowercasedValue)
            );
            setMatchingFoods(matches);
        } else {
            setMatchingFoods([]);
        }
    };

    const handleProteinInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (isValidNumberOrBlank(e.target.value)) {
            setProteinInput(e.target.value);
        }
    };

    const handleCalorieInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (isValidNumberOrBlank(e.target.value)) {
            setCalorieInput(e.target.value);
        }
    };

    const handleDropdownClick = (foodName: string): void => {
        setInput(foodName);
        setMatchingFoods([]);
        inputRef.current?.focus();
    };

    const handleAddFood = (): void => {
        if (input.trim() === '') {
            return;
        }

        const currentDate = getTodayDate();
        if (!database[input]) {
            setShowForm(true);
            setShowCancel(true);
            return;
        }
        setDailyDiet([...dailyDiet, { date: currentDate, name: input, ...database[input] }]);
        setInput('');
    };

    const handleCancel = (): void => {
        setShowForm(false);
        setInput('');
        setShowCancel(false);
        setAIDataReturned(false);
    };

    const handleKeyDownAdd = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && input.trim()) {
            handleAddFood();
        }
    };

    const handleSubmitNewFood = async (): Promise<void> => {
        if (input.trim() === '') {
            return;
        }

        const currentDate = getTodayDate();
        const protein = parseFloat(proteinInput);
        const calories = parseFloat(calorieInput);

        const newFoodData = {
            name: input,
            protein: isNaN(protein) ? 0 : protein,
            calories: isNaN(calories) ? 0 : calories,
            unit: unitInput || "serving",
            id: 0 // Temporary ID that will be replaced by the server
        };

        // Add to local state
        const updatedDatabase = {
            ...database,
            [input]: newFoodData
        };
        setDatabase(updatedDatabase);

        await addFoodToDatabase({
            name: input,
            protein: newFoodData.protein,
            calories: newFoodData.calories,
            unit: newFoodData.unit
        });

        setDailyDiet([...dailyDiet, { 
            date: currentDate, 
            name: input, 
            id: 0, // This will be updated by the server response
            protein: newFoodData.protein, 
            calories: newFoodData.calories, 
            unit: newFoodData.unit 
        }]);
        
        setInput('');
        setProteinInput('');
        setCalorieInput('');
        setUnitInput('');
        setShowForm(false);
        setShowCancel(false);
        setHideAIResponse(true);
        setAIDataReturned(false);
    };

    const handleAIData = (data: AIData | null): void => {
        if (data) {
            setInput(data.food_name.toLowerCase() || '');
            setProteinInput(data.protein || '');
            setCalorieInput(data.calories || '');
            setUnitInput(data.measurement || '');
            setShowForm(true);
            setHideAIResponse(false);
            setAIDataReturned(true);
        }
    };

    return (
        <div className="flex flex-col pb-5 gap-2.5">
            <div className="flex flex-wrap gap-2.5">
                <div className="relative flex-1 min-w-[150px]">
                    <input
                        name="foodInputName"
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDownAdd}
                        onBlur={() => setTimeout(() => setMatchingFoods([]), 150)}
                        placeholder="Enter food name"
                        className="h-[30px] w-full text-center border border-gray-300 rounded"
                    />
                    {matchingFoods.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 max-h-[150px] overflow-y-auto shadow-md">
                            {matchingFoods.map(food => (
                                <div
                                    key={food}
                                    onClick={() => handleDropdownClick(food)}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                >
                                    {food}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {showCancel ? (
                    <button 
                        onClick={handleCancel}
                        className="h-[36px] px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                ) : (
                    <button 
                        onClick={handleAddFood} 
                        disabled={!input.trim()}
                        className="h-[36px] px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Food
                    </button>
                )}

                <div className="ml-2">
                    <AIQueryComponent onDataReceived={handleAIData} hideResponse={hideAIResponse} />
                </div>
            </div>

            {showForm && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex flex-col gap-3">
                        <p className="mb-2">{aiDataReturned ? "We guesstimated the amount. Please Review." : "Please fill in as much as possible."}</p>
                        
                        <input 
                            value={proteinInput} 
                            onChange={handleProteinInputChange} 
                            placeholder="Protein" 
                            className="h-[30px] text-center border border-gray-300 rounded w-full"
                        />
                        
                        <input 
                            value={calorieInput} 
                            onChange={handleCalorieInputChange} 
                            placeholder="Calories" 
                            className="h-[30px] text-center border border-gray-300 rounded w-full"
                        />
                        
                        <input 
                            value={unitInput} 
                            onChange={(e) => setUnitInput(e.target.value)} 
                            placeholder="Unit of Measurement" 
                            className="h-[30px] text-center border border-gray-300 rounded w-full"
                        />
                        
                        <div className="flex gap-2 mt-2">
                            <button 
                                onClick={handleSubmitNewFood} 
                                disabled={!input.trim()}
                                className="h-[36px] px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Submit New Food
                            </button>
                        </div>
                    </div>
                </div>  
            )}
        </div>
    );
};

export default FoodInput; 