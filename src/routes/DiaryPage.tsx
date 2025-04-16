import React, { useContext, useState, useEffect } from 'react';
import { DietContext } from '../DietContext';
import MacroProgressDisplay from '../components/MacroProgressDisplay';
import WeeklyMacroChart from '../components/WeeklyMacroChart';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const DiaryPage: React.FC = () => {
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

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    useEffect(() => {
        // Fetch the latest goal
        const fetchLatestGoal = async () => {
            try {
                const latestGoal = await goalsTable.getLatest();
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
        
        setTodaysMacros(totals);
    }, [dailyDiet, formattedToday]);


    return (
        <motion.div 
            className="flex flex-col gap-4 px-2 sm:px-4 md:px-6 lg:px-8 py-4 w-full max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Macro Progress Component - Single Conditional */}
            <motion.div 
                className="p-3 sm:p-4 bg-white rounded-lg shadow-sm"
                variants={itemVariants}
            >
                {!isLoading && currentGoal ? (
                    <MacroProgressDisplay 
                        currentProtein={todaysMacros.protein}
                        currentCarbs={todaysMacros.carbs}
                        currentFat={todaysMacros.fat}
                        currentCalories={todaysMacros.calories}
                        targetProtein={Number(currentGoal.protein)}
                        targetCarbs={Number(currentGoal.carbs)}
                        targetFat={Number(currentGoal.fat)}
                        targetCalories={Number(currentGoal.calories)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-24 text-gray-500 text-base" aria-busy="true" aria-label="Loading macro progress">
                        Loading macro progress...
                    </div>
                )}
            </motion.div>
            
            {/* Weekly Overview Chart */}
            <motion.div 
                className="p-3 sm:p-4 bg-white rounded-lg shadow-sm"
                variants={itemVariants}
            >
                <WeeklyMacroChart height={300} />
            </motion.div>
            
            {/* Message if no goal is set */}
            {!isLoading && !currentGoal && (
                <motion.div 
                    className="p-3 sm:p-4 bg-white rounded-lg shadow-sm"
                    variants={itemVariants}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <p className="text-sm sm:text-base text-yellow-700">
                        You haven't set any macro goals yet. Please go to the <a href="/goals" className="text-blue-600 hover:underline" tabIndex={0} aria-label="Go to Goal Setting page">Goal Setting</a> page to set your targets.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default DiaryPage; 