import React, { useState } from "react";

// Get the appropriate API URL based on environment
const API_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
    : (import.meta.env.VITE_NETLIFY_URL || 'https://main--shimmering-figolla-53e06a.netlify.app/api');

// For debugging
console.log('AI Component API_URL:', API_URL);

interface AIData {
    food_name: string;
    protein: string;
    calories: string;
    measurement: string;
}

interface AIQueryComponentProps {
    onDataReceived: (data: AIData | null) => void;
    hideResponse: boolean;
}

const AIQueryComponent: React.FC<AIQueryComponentProps> = ({ onDataReceived, hideResponse }) => {
    const [showAIInput, setShowAIInput] = useState<boolean>(false);
    const [aiInputText, setAIInputText] = useState<string>("");
    const [aiResponse, setAiResponse] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleAIInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setAIInputText(e.target.value);
    };

    const handleSubmitToAI = async (): Promise<void> => {
        if (!aiInputText.trim()) return;
        
        try {
            setIsLoading(true);
            setAiResponse("Fetching data...");

            const endpoint = import.meta.env.DEV
                ? `${API_URL}/query-openai`
                : (import.meta.env.VITE_NETLIFY_URL 
                   ? `${import.meta.env.VITE_NETLIFY_URL}/query-openai` 
                   : '/.netlify/functions/query-openai');

            console.log('Using endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ aiInputText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const aiOutput = await response.json();
            let data: AIData | null = null;
            try {
                data = JSON.parse(aiOutput);
            } catch (error) {
                console.error("Failed to parse AI response:", aiOutput);
                setAiResponse("Error parsing data from OpenAI.");
                return;
            }

            if (data) {
                setAiResponse(aiOutput);
                onDataReceived(data);
            }
        } catch (error) {
            console.error("Error with OpenAI:", error);
            setAiResponse("Error fetching data. Please try again later.");
        } finally {
            setIsLoading(false);
            setAIInputText("");
            setShowAIInput(false);
        }
    };

    const handleKeyDownAI = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter" && aiInputText.trim() && !isLoading) {
            handleSubmitToAI();
        }
    };

    return (
        <>
            <button 
                className="ml-2.5 h-[36px] px-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" 
                onClick={() => setShowAIInput(!showAIInput)}
                disabled={isLoading}
            >
                {isLoading ? "Processing..." : "Ask AI"}
            </button>

            {showAIInput && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-20">
                    <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-md">
                        <div className="pt-2.5 flex flex-col">
                            <input
                                value={aiInputText}
                                onChange={handleAIInputChange}
                                onKeyDown={handleKeyDownAI}
                                placeholder="Please describe the food as detailed as possible."
                                disabled={isLoading}
                                className="h-[50px] w-full border-0 border-b border-black bg-transparent outline-none mb-4 px-2"
                            />
                            <button 
                                onClick={handleSubmitToAI} 
                                disabled={!aiInputText.trim() || isLoading}
                                className="h-[36px] px-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? "Processing..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!hideResponse && <div className="pt-2.5 text-gray-700">{aiResponse}</div>}
        </>
    );
};

export default AIQueryComponent; 