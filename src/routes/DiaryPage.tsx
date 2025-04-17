import React, { useContext, useState, useEffect } from 'react';
import { DietContext } from '../DietContext';
import CompactMacroChart from '../components/CompactMacroChart';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import SimpleDailyFoodTable from '../components/SimpleDailyFoodTable';
import FoodDatabaseSidebar from '../components/FoodDatabaseSidebar';

const DiaryPage: React.FC = () => {
    const dietContext = useContext(DietContext);
    const [currentGoal, setCurrentGoal] = useState<MacroGoal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    if (!dietContext) {
        throw new Error('Dashboard must be used within a DietProvider');
    }

    const { dailyDiet, database } = dietContext;

    // Calculate today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');


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
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLatestGoal();
    }, []);

    // Get today's food entries
    const todaysDietEntries = dailyDiet.filter(entry => entry.date === formattedToday);

    return (
        <div className="flex h-[100vh]">
            {/* Main Content */}
            <div className="flex-1 flex flex-col px-2 sm:px-4 md:px-6 lg:px-8 py-4 min-w-0">
                <div className="pt-8 pb-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            tabIndex={0}
                            aria-label="Back to Home"
                            onClick={() => window.location.href = '/'}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    window.location.href = '/';
                                }
                            }}
                            className="p-2 rounded-full hover:bg-gray-200 focus:bg-gray-200 focus:outline-none transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                                stroke="currentColor"
                                className="w-6 h-6 text-red-800"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <h1 className="text-4xl font-bold">Macro Diary</h1>
                    </div>
                </div>
                <motion.div
                    className="p-3 sm:p-4 bg-white rounded-lg shadow-sm max-h-[calc(100vh-336px)] overflow-hidden"
                    variants={itemVariants}
                >
                    {!isLoading && currentGoal ? (
                        <div className="h-full overflow-y-auto">
                            <SimpleDailyFoodTable entries={todaysDietEntries} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-24 text-gray-500 text-base" aria-busy="true" aria-label="Loading macro progress">
                            Loading macro progress...
                        </div>
                    )}
                </motion.div>
                <motion.div
                    className="mt-4"
                    variants={itemVariants}
                >
                    <CompactMacroChart height={180} />
                </motion.div>
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
            </div>
            {/* Fixed Sidebar */}
            <div className="w-60 lg:w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 h-full">
                <FoodDatabaseSidebar database={database} />
            </div>
        </div>
    );
};

export default DiaryPage; 