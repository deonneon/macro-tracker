import React, { useState, useContext, useRef } from 'react';
import { DietContext } from '../DietContext';
import AIQueryComponent from '../AIQueryComponent';

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

interface ValidationErrors {
    protein?: string;
    carbs?: string;
    fat?: string;
    calories?: string;
    macroBalance?: string;
}

const FoodInput: React.FC = () => {
    const dietContext = useContext(DietContext);
    
    if (!dietContext) {
        throw new Error('FoodInput must be used within a DietProvider');
    }
    
    const { database, setDatabase, dailyDiet, setDailyDiet, addFoodToDatabase } = dietContext;
    
    const [input, setInput] = useState<string>('');
    const [proteinInput, setProteinInput] = useState<string>('');
    const [carbsInput, setCarbsInput] = useState<string>('');
    const [fatInput, setFatInput] = useState<string>('');
    const [calorieInput, setCalorieInput] = useState<string>('');
    const [unitInput, setUnitInput] = useState<string>('');
    const [servingSizeInput, setServingSizeInput] = useState<string>('');
    const [matchingFoods, setMatchingFoods] = useState<string[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [showCancel, setShowCancel] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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

    const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>): void => {
        if (isValidNumberOrBlank(e.target.value)) {
            setter(e.target.value);
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
        setProteinInput('');
        setCarbsInput('');
        setFatInput('');
        setCalorieInput('');
        setUnitInput('');
        setServingSizeInput('');
        setShowCancel(false);
        setAIDataReturned(false);
        setValidationErrors({});
    };

    const handleKeyDownAdd = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && input.trim()) {
            handleAddFood();
        }
    };

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};
        
        // Required field validation
        if (!input.trim()) {
            return false; // Name is required
        }
        
        // Parse numeric values
        const protein = parseFloat(proteinInput) || 0;
        const carbs = parseFloat(carbsInput) || 0;
        const fat = parseFloat(fatInput) || 0;
        const calories = parseFloat(calorieInput) || 0;
        
        // Macronutrient balance validation
        if (protein > 0 && carbs > 0 && fat > 0 && calories > 0) {
            const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
            const tolerance = 10; // Allow up to 10 calorie difference to account for rounding
            
            if (Math.abs(calculatedCalories - calories) > tolerance) {
                errors.macroBalance = `Calculated calories (${calculatedCalories.toFixed(0)}) don't match input calories (${calories})`;
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitNewFood = async (): Promise<void> => {
        if (!validateForm()) {
            return;
        }

        const currentDate = getTodayDate();
        const protein = parseFloat(proteinInput) || 0;
        const carbs = parseFloat(carbsInput) || 0;
        const fat = parseFloat(fatInput) || 0;
        const calories = parseFloat(calorieInput) || 0;
        const servingSize = parseFloat(servingSizeInput) || 1;

        const newFoodData = {
            name: input,
            protein,
            carbs,
            fat,
            calories,
            servingSize,
            unit: unitInput || "serving",
            id: 0 // Temporary ID that will be replaced by the server
        };

        // Add to local state
        const updatedDatabase = {
            ...database,
            [input]: newFoodData
        };
        setDatabase(updatedDatabase);

        try {
            await addFoodToDatabase({
                name: input,
                protein: newFoodData.protein,
                carbs: newFoodData.carbs,
                fat: newFoodData.fat,
                calories: newFoodData.calories,
                servingSize: newFoodData.servingSize,
                unit: newFoodData.unit
            });

            setDailyDiet([...dailyDiet, { 
                date: currentDate, 
                name: input, 
                id: 0, // This will be updated by the server response
                protein: newFoodData.protein,
                carbs: newFoodData.carbs,
                fat: newFoodData.fat,
                calories: newFoodData.calories,
                servingSize: newFoodData.servingSize,
                unit: newFoodData.unit 
            }]);
            
            // Reset form
            handleCancel();
            setHideAIResponse(true);
        } catch (error) {
            console.error('Error adding food to database:', error);
            // Show error message to user
            alert('Failed to add food to database. Please try again.');
        }
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

    const getUnitOptions = (): string[] => {
        return ['serving', 'g', 'oz', 'cup', 'tbsp', 'tsp', 'slice', 'piece', 'ml'];
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
                        aria-label="Food name"
                    />
                    {matchingFoods.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 max-h-[150px] overflow-y-auto shadow-md">
                            {matchingFoods.map(food => (
                                <div
                                    key={food}
                                    onClick={() => handleDropdownClick(food)}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                    tabIndex={0}
                                    role="option"
                                    aria-selected="false"
                                    onKeyDown={(e) => e.key === 'Enter' && handleDropdownClick(food)}
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
                        aria-label="Cancel adding food"
                        tabIndex={0}
                    >
                        Cancel
                    </button>
                ) : (
                    <button 
                        onClick={handleAddFood} 
                        disabled={!input.trim()}
                        className="h-[36px] px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        aria-label="Add food"
                        tabIndex={0}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label htmlFor="protein-input" className="text-sm text-gray-600 mb-1">Protein (g)</label>
                                <input 
                                    id="protein-input"
                                    value={proteinInput} 
                                    onChange={(e) => handleNumericInputChange(e, setProteinInput)} 
                                    placeholder="0" 
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Protein in grams"
                                />
                                {validationErrors.protein && <p className="text-red-500 text-xs mt-1">{validationErrors.protein}</p>}
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="carbs-input" className="text-sm text-gray-600 mb-1">Carbs (g)</label>
                                <input 
                                    id="carbs-input"
                                    value={carbsInput} 
                                    onChange={(e) => handleNumericInputChange(e, setCarbsInput)} 
                                    placeholder="0" 
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Carbohydrates in grams"
                                />
                                {validationErrors.carbs && <p className="text-red-500 text-xs mt-1">{validationErrors.carbs}</p>}
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="fat-input" className="text-sm text-gray-600 mb-1">Fat (g)</label>
                                <input 
                                    id="fat-input"
                                    value={fatInput} 
                                    onChange={(e) => handleNumericInputChange(e, setFatInput)} 
                                    placeholder="0" 
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Fat in grams"
                                />
                                {validationErrors.fat && <p className="text-red-500 text-xs mt-1">{validationErrors.fat}</p>}
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="calorie-input" className="text-sm text-gray-600 mb-1">Calories</label>
                                <input 
                                    id="calorie-input"
                                    value={calorieInput} 
                                    onChange={(e) => handleNumericInputChange(e, setCalorieInput)} 
                                    placeholder="0" 
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Calories"
                                />
                                {validationErrors.calories && <p className="text-red-500 text-xs mt-1">{validationErrors.calories}</p>}
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="serving-size-input" className="text-sm text-gray-600 mb-1">Serving Size</label>
                                <input 
                                    id="serving-size-input"
                                    value={servingSizeInput} 
                                    onChange={(e) => handleNumericInputChange(e, setServingSizeInput)} 
                                    placeholder="1" 
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Serving size"
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="unit-input" className="text-sm text-gray-600 mb-1">Unit</label>
                                <select
                                    id="unit-input"
                                    value={unitInput}
                                    onChange={(e) => setUnitInput(e.target.value)}
                                    className="h-[30px] text-center border border-gray-300 rounded w-full"
                                    aria-label="Unit of measurement"
                                >
                                    <option value="">Select unit</option>
                                    {getUnitOptions().map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {validationErrors.macroBalance && (
                            <p className="text-amber-600 text-sm mt-1 p-2 bg-amber-50 rounded border border-amber-200">
                                {validationErrors.macroBalance}
                            </p>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                            <button 
                                onClick={handleSubmitNewFood} 
                                disabled={!input.trim()}
                                className="h-[36px] px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                aria-label="Submit new food"
                                tabIndex={0}
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