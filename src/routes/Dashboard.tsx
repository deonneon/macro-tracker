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
                setCurrentGoal(latestGoal);
            } catch (error) {
                console.error('Error fetching latest goal:', error);
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
        
        setTodaysMacros(totals);
    }, [dailyDiet, formattedToday]);

    return (
        <div className="flex flex-col gap-4">
            {/* Macro Progress Component */}
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
            
            {/* Weekly Overview Chart */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-3">Weekly Macro Overview</h2>
                <WeeklyMacroChart height={350} />
            </div>
            
            {/* Message if no goal is set */}
            {!isLoading && !currentGoal && (
                <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p className="text-yellow-700">
                        You haven't set any macro goals yet. Please go to the <a href="/goals" className="text-blue-600 hover:underline">Goal Setting</a> page to set your targets.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 