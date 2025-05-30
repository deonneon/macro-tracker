import React, { useState, useContext, useRef, useEffect } from "react";
import { DietContext } from "../DietContext";
import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import { queryAI, AIData } from "../services/aiQueryService";

/**
 * Get today's date in YYYY-MM-DD format using the user's timezone
 */
function getTodayDate(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone,
  }).format(now);
  const month = new Intl.DateTimeFormat("en", {
    month: "2-digit",
    timeZone,
  }).format(now);
  const day = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    timeZone,
  }).format(now);
  return `${year}-${month}-${day}`;
}

/**
 * Validates if a string is a valid number or blank
 */
const isValidNumberOrBlank = (value: string): boolean => {
  return /^(\d+(\.\d+)?)?$/.test(value);
};

interface QuickFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickFoodModal: React.FC<QuickFoodModalProps> = ({ isOpen, onClose }) => {
  // Get diet context
  const dietContext = useContext(DietContext);

  if (!dietContext) {
    throw new Error("QuickFoodModal must be used within a DietProvider");
  }

  const { database, addFoodToDatabase, addFoodEntryToDailyDiet } = dietContext;

  // State for form inputs
  const [input, setInput] = useState<string>("");
  const [inputFoodName, setInputFoodName] = useState<string>("");
  const [proteinInput, setProteinInput] = useState<number>(0);
  const [calorieInput, setCalorieInput] = useState<number>(0);
  const [carbsInput, setCarbsInput] = useState<number>(0);
  const [fatInput, setFatInput] = useState<number>(0);
  const [unitInput, setUnitInput] = useState<string>("");
  const [servingSizeInput, setServingSizeInput] = useState<number>(1);

  // State for UI control
  const [matchingFoods, setMatchingFoods] = useState<string[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [aiData, setAIData] = useState<AIData | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  // References
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all form inputs when the modal closes
      resetForm();
    } else if (inputRef.current) {
      // Focus the input field when the modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setMatchingFoods([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetForm = () => {
    setInput("");
    setProteinInput(0);
    setCarbsInput(0);
    setFatInput(0);
    setCalorieInput(0);
    setUnitInput("");
    setServingSizeInput(1);
    setShowForm(false);
    setMatchingFoods([]);
    setIsAILoading(false);
    setAIData(null);
    setAIError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lowercasedValue = e.target.value.toLowerCase();
    setInput(lowercasedValue);

    if (lowercasedValue) {
      const matches = Object.keys(database).filter((food) =>
        food.toLowerCase().includes(lowercasedValue)
      );
      setMatchingFoods(matches);
    } else {
      setMatchingFoods([]);
    }
  };

  const handleProteinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidNumberOrBlank(e.target.value)) {
      setProteinInput(Number(e.target.value));
    }
  };

  const handleCalorieInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidNumberOrBlank(e.target.value)) {
      setCalorieInput(Number(e.target.value));
    }
  };

  const handleCarbsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidNumberOrBlank(e.target.value)) {
      setCarbsInput(Number(e.target.value));
    }
  };

  const handleFatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidNumberOrBlank(e.target.value)) {
      setFatInput(Number(e.target.value));
    }
  };

  const handleServingSizeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isValidNumberOrBlank(e.target.value)) {
      setServingSizeInput(Number(e.target.value));
    }
  };

  const handleDropdownClick = (foodName: string) => {
    setInput(foodName);
    setMatchingFoods([]);
    inputRef.current?.focus();
  };

  const fetchAINutritionData = async (foodName: string) => {
    setIsAILoading(true);
    setAIData(null);
    setAIError(null);
    try {
      const data = await queryAI(foodName);

      console.log("Data received in QuickFoodModal:", data);

      setAIData(data);
      setInputFoodName(data?.food_name || "");
      setProteinInput(data?.protein || 0);
      setCalorieInput(data?.calories || 0);
      setCarbsInput(data?.carb || 0);
      setFatInput(data?.fat || 0);
      setUnitInput(data?.measurementUnit || "");
      setServingSizeInput(data?.measurementSize || 1);
    } catch (error: Error | unknown) {
      console.error("Error in fetchAINutritionData:", error);
      setAIError(
        error instanceof Error
          ? error.message
          : "Failed to fetch nutrition data."
      );
    }
    setIsAILoading(false);
  };

  const handleAddFood = () => {
    if (input.trim() === "") return;
    const currentDate = getTodayDate();
    if (!database[input]) {
      setShowForm(true);
      setIsAILoading(true);
      fetchAINutritionData(input);
      return;
    }

    // Use the proper function to add to daily diet instead of manually updating state
    const foodFromDatabase = database[input];
    addFoodEntryToDailyDiet({ ...foodFromDatabase, name: input }, currentDate)
      .then(() => {
        resetForm();
        onClose();
      })
      .catch((error: Error) => {
        console.error("Error adding food to daily diet:", error);
        alert("Failed to add food. Please try again.");
      });
  };

  const handleKeyDownAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      handleAddFood();
    }
  };

  const handleSubmitNewFood = async () => {
    if (input.trim() === "") return;

    const currentDate = getTodayDate();

    // Prepare food data with all the collected information
    const newFoodData = {
      name: inputFoodName,
      protein: proteinInput,
      carbs: carbsInput,
      fat: fatInput,
      calories: calorieInput,
      serving_size: Number(servingSizeInput),
      unit: unitInput,
    };

    try {
      // Add to database via context
      await addFoodToDatabase(newFoodData);

      // Wait a moment for the database to be updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Now add to daily diet using the proper function
      // We need to get the food ID from the database after it's been added
      const { foodsTable } = await import("../lib/supabase");
      const newlyCreatedFood = await foodsTable.getByName(inputFoodName);

      if (newlyCreatedFood) {
        await addFoodEntryToDailyDiet(
          {
            id: newlyCreatedFood.id || 0,
            name: newlyCreatedFood.name,
            protein: newlyCreatedFood.protein,
            carbs: newlyCreatedFood.carbs || 0,
            fat: newlyCreatedFood.fat || 0,
            calories: newlyCreatedFood.calories,
            serving_size: newlyCreatedFood.serving_size || 1,
            unit: newlyCreatedFood.unit,
          },
          currentDate
        );
      }

      // Close the modal after adding
      resetForm();
      onClose();
    } catch (error: Error | unknown) {
      console.error("Error adding food:", error);
      alert("Failed to add food. Please try again.");
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Smart Add Form
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
              tabIndex={0}
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            <p className="text-gray-500 text-sm mb-6">
              Add a food name or detailed food description
            </p>
            <div className="relative mb-4">
              <input
                name="foodInputName"
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDownAdd}
                placeholder="Enter food name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Food name"
                tabIndex={0}
              />

              {matchingFoods.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {matchingFoods.map((food) => (
                    <div
                      key={food}
                      onClick={() => handleDropdownClick(food)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      role="option"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleDropdownClick(food)
                      }
                    >
                      {food}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showForm ? (
              <div className="mt-4 border-t border-gray-300 pt-4">
                {isAILoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500 text-sm">
                      Fetching nutrition data...
                    </span>
                    <svg
                      className="animate-spin ml-2 h-5 w-5 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                  </div>
                ) : aiError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-red-500 text-sm mb-2">{aiError}</span>
                    <button
                      type="button"
                      onClick={() => fetchAINutritionData(input)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-gray-700">
                      {aiData
                        ? "Food was not found in your history. We've estimated nutritional values. Please review and adjust if needed."
                        : "Please fill in the nutritional details:"}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="protein"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Protein (g)
                        </label>
                        <input
                          id="protein"
                          value={proteinInput}
                          onChange={handleProteinInputChange}
                          placeholder="Protein"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="calories"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Calories
                        </label>
                        <input
                          id="calories"
                          value={calorieInput}
                          onChange={handleCalorieInputChange}
                          placeholder="Calories"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="carbs"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Carbs (g)
                        </label>
                        <input
                          id="carbs"
                          value={carbsInput}
                          onChange={handleCarbsInputChange}
                          placeholder="Carbs"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="fat"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Fat (g)
                        </label>
                        <input
                          id="fat"
                          value={fatInput}
                          onChange={handleFatInputChange}
                          placeholder="Fat"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="servingSize"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Serving Size
                        </label>
                        <input
                          id="servingSize"
                          value={servingSizeInput}
                          onChange={handleServingSizeInputChange}
                          placeholder="Serving Size"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="unit"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Unit
                        </label>
                        <input
                          id="unit"
                          value={unitInput}
                          onChange={(e) => setUnitInput(e.target.value)}
                          placeholder="Unit (g, oz, ml...)"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Cancel"
              tabIndex={0}
            >
              Cancel
            </button>

            {showForm ? (
              <button
                type="button"
                onClick={handleSubmitNewFood}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!input.trim()}
                aria-label="Add New Food"
                tabIndex={0}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add New Food
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddFood}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={!input.trim()}
                aria-label="Add Food"
                tabIndex={0}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Food
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickFoodModal;
