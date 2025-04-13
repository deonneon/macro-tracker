import React, { useContext, useState, useEffect } from 'react';
import { DietContext } from '../DietContext';
import MacroProgressDisplay from '../components/MacroProgressDisplay';
import WeeklyMacroChart from '../components/WeeklyMacroChart';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
    const dietContext = useContext(DietContext);
    const [currentGoal, setCurrentGoal] = useState<MacroGoal | null>(null);
    const [todaysMacros, setTodaysMacros] = useState({
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    if (!dietContext) {
        throw new Error('Dashboard must be used within a DietProvider');
    }

    const { dailyDiet } = dietContext;

    // Calculate today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');

    useEffect(() => {
        // Fetch the latest goal
        const fetchLatestGoal = async () => {
            try {
                const latestGoal = await goalsTable.getLatest();
                console.log('Fetched latest goal:', latestGoal);
                setCurrentGoal(latestGoal);
            } catch (error) {
                console.error('Error fetching latest goal:', error);
                // Even if there's an error, we should still set loading to false
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLatestGoal();
    }, []);

    // Calculate today's macros whenever dailyDiet changes
    useEffect(() => {
        const todaysDietEntries = dailyDiet.filter(entry => entry.date === formattedToday);
        
        const totals = todaysDietEntries.reduce((acc, entry) => {
            return {
                protein: acc.protein + (entry.protein || 0),
                carbs: acc.carbs + (entry.carbs || 0),
                fat: acc.fat + (entry.fat || 0),
                calories: acc.calories + (entry.calories || 0)
            };
        }, { protein: 0, carbs: 0, fat: 0, calories: 0 });
        
        console.log('Calculated today\'s macros:', totals);
        setTodaysMacros(totals);
    }, [dailyDiet, formattedToday]);

    // Debug info
    console.log('Rendering Dashboard with state:', { 
        isLoading, 
        hasCurrentGoal: !!currentGoal, 
        todaysMacros 
    });

    return (
        <div className="flex flex-col gap-4 px-2 sm:px-4 md:px-6 lg:px-8 py-4 w-full max-w-7xl mx-auto">
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-gray-100 text-xs">
                    <p>isLoading: {isLoading ? 'true' : 'false'}</p>
                    <p>currentGoal: {currentGoal ? 'exists' : 'null'}</p>
                    <p>todaysMacros: P{Math.round(todaysMacros.protein)}g C{Math.round(todaysMacros.carbs)}g F{Math.round(todaysMacros.fat)}g Cal{Math.round(todaysMacros.calories)}</p>
                </div>
            )}

            {/* Macro Progress Component - Conditionally Rendered */}
            {!isLoading && currentGoal && (
                <MacroProgressDisplay 
                    currentProtein={todaysMacros.protein}
                    currentCarbs={todaysMacros.carbs}
                    currentFat={todaysMacros.fat}
                    currentCalories={todaysMacros.calories}
                    targetProtein={currentGoal.protein_goal}
                    targetCarbs={currentGoal.carbs_goal}
                    targetFat={currentGoal.fat_goal}
                    targetCalories={currentGoal.calories_goal}
                />
            )}
            
            {/* Fallback Macro Progress - Always Rendered For Testing */}
            {isLoading || !currentGoal ? (
                <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                    <MacroProgressDisplay 
                        currentProtein={50}
                        currentCarbs={150}
                        currentFat={40}
                        currentCalories={1200}
                        targetProtein={150}
                        targetCarbs={250}
                        targetFat={60}
                        targetCalories={2000}
                    />
                </div>
            ) : null}
            
            {/* Weekly Overview Chart */}
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Weekly Macro Overview</h2>
                <WeeklyMacroChart height={300} />
            </div>
            
            {/* Message if no goal is set */}
            {!isLoading && !currentGoal && (
                <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p className="text-sm sm:text-base text-yellow-700">
                        You haven't set any macro goals yet. Please go to the <a href="/goals" className="text-blue-600 hover:underline" tabIndex={0} aria-label="Go to Goal Setting page">Goal Setting</a> page to set your targets.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 