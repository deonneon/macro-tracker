import React, { useContext, useState, useEffect, useRef } from 'react';
import { DietContext } from '../DietContext';
import CompactMacroChart from '../components/CompactMacroChart';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import SimpleDailyFoodTable from '../components/SimpleDailyFoodTable';
import FoodDatabaseSidebar from '../components/FoodDatabaseSidebar';
import QuickFoodModal from '../components/QuickFoodModal';

const DiaryPage: React.FC = () => {
    const dietContext = useContext(DietContext);
    const [currentGoal, setCurrentGoal] = useState<MacroGoal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isQuickFoodModalOpen, setIsQuickFoodModalOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

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

    // Accessibility: Close drawer on Esc
    useEffect(() => {
        if (!isSidebarOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    // Accessibility: Focus trap for drawer
    useEffect(() => {
        if (isSidebarOpen && drawerRef.current) {
            drawerRef.current.focus();
        }
    }, [isSidebarOpen]);

    return (
        <div className="flex main-container safe-area">
            {/* Main Content */}
            <div className="flex-1 flex flex-col px-2 sm:px-4 md:px-6 lg:px-8 py-4 min-w-0">
                <div className="pt-2 pb-2 sm:pt-8 sm:pb-6">
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
                        <h1 className="text-3xl sm:text-4xl font-bold">Macro Diary</h1>
                    </div>
                </div>
                <motion.div
                    className="p-3 sm:p-4 bg-white rounded-lg shadow-sm food-table-container overflow-hidden"
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
                    className="mt-4 overflow-hidden"
                    variants={itemVariants}
                >
                    <div className="w-full px-1">
                        <CompactMacroChart height={180} />
                    </div>
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
            {/* Sidebar for desktop */}
            <div className="hidden md:flex w-60 lg:w-72 flex-shrink-0 border-l border-gray-200 h-full">
                <FoodDatabaseSidebar database={database} />
            </div>
            {/* Mobile Drawer Button */}
            <div className="fixed top-7 sm:top-13 right-4 z-40 md:hidden flex gap-2">
                <button
                    type="button"
                    tabIndex={0}
                    aria-label="Add Food Quickly"
                    onClick={() => setIsQuickFoodModalOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setIsQuickFoodModalOpen(true);
                    }}
                    className="bg-red-700 text-white rounded-full shadow-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all flex items-center justify-center border-none outline-none"
                >
                    {/* Plus Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
                    </svg>
                </button>
                <button
                    type="button"
                    tabIndex={0}
                    aria-label="Open Food Database"
                    onClick={() => setIsSidebarOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setIsSidebarOpen(true);
                    }}
                    className="bg-blue-700 text-white rounded-full shadow-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all flex items-center justify-center"
                >
                    {/* Hamburger Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                        aria-hidden="true"
                    >
                        <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
            {/* Mobile Drawer Sidebar */}
            {isSidebarOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-40 md:hidden backdrop-blur-[2px] transition-opacity"
                        aria-label="Sidebar overlay"
                        tabIndex={-1}
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    {/* Drawer */}
                    <div
                        ref={drawerRef}
                        tabIndex={0}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Food Database Drawer"
                        className="fixed top-0 right-0 h-full w-3/5 max-w-xs bg-white shadow-xl z-50 md:hidden flex flex-col outline-none transition-transform duration-300 ease-in-out transform translate-x-0"
                    >
                        <div className="flex-1 overflow-y-auto">
                            <FoodDatabaseSidebar database={database} />
                        </div>
                    </div>
                </>
            )}
            {/* QuickFoodModal */}
            <QuickFoodModal
                isOpen={isQuickFoodModalOpen}
                onClose={() => setIsQuickFoodModalOpen(false)}
            />
        </div>
    );
};

export default DiaryPage; 