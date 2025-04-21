// AIData interface for nutrition data returned by AI
export interface AIData {
    food_name: string;
    protein: number;
    calories: number;
    carb: number;
    fat: number;
    measurementSize: number;
    measurementUnit: string;
}

// Get the appropriate API URL based on environment
const API_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
    : (import.meta.env.VITE_NETLIFY_URL || 'https://main--shimmering-figolla-53e06a.netlify.app/api');

export const queryAI = async (aiInputText: string): Promise<AIData | null> => {
    if (!aiInputText.trim()) return null;
    try {
        const endpoint = import.meta.env.DEV
            ? `${API_URL}/query-openai`
            : (import.meta.env.VITE_NETLIFY_URL 
               ? `${import.meta.env.VITE_NETLIFY_URL}/query-openai` 
               : '/.netlify/functions/query-openai');

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ aiInputText }),
        });

        const aiOutput = await response.json();
        console.log("fetch from backend", aiOutput);
        console.log("fetch from backend, food_name", aiOutput.food_name);

        return {
            food_name: aiOutput.food_name,
            protein: aiOutput.protein,
            calories: aiOutput.calories,
            carb: aiOutput.carb,
            fat: aiOutput.fat,
            measurementSize: aiOutput.measurementSize,
            measurementUnit: aiOutput.measurementUnit,
        };

    } catch (error) {
        console.error("Error with OpenAI:", error);
        return null;
    }
}; 