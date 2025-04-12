import React, { useContext, useState, useEffect } from 'react';
import { DietContext } from '../DietContext';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import MacroProgressDisplay from '../components/MacroProgressDisplay';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        x: {
            ticks: {
                display: true,
            },
            grid: {
                display: false // hide grid lines
            }
        },
        y: {
            ticks: {
                display: true,
                // Ensuring only integer values are displayed
                callback: function (value: any) {
                    if (typeof value === 'number' && value % 1 === 0) {
                        return value;
                    }
                    return undefined;
                }
            },
            grid: {
                display: false // hide grid lines
            }
        }
    }
};

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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Filter entries from the last 7 days
    const lastSevenDaysData = dailyDiet.filter(entry => {
        // Parse date in local timezone
        const entryDate = new Date(entry.date + 'T00:00:00');
        return entryDate >= sevenDaysAgo && entryDate <= today;
    });

    // Aggregate proteins per day
    const totalProteinsPerDay = lastSevenDaysData.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.date] = (acc[entry.date] || 0) + Number(entry.protein);
        return acc;
    }, {});

    // Aggregate calories per day
    const totalCaloriesPerDay = lastSevenDaysData.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.date] = (acc[entry.date] || 0) + Number(entry.calories);
        return acc;
    }, {});

    const dates = Object.keys(totalProteinsPerDay).map(dateStr => {
        // Ensure local timezone is considered
        const dateObj = new Date(dateStr + 'T00:00:00');
        return dateObj.getDate(); // Get only the day part
    });

    const uniqueDates = [...new Set(dates)];
    const proteinValues = Object.values(totalProteinsPerDay);
    const calorieValues = Object.values(totalCaloriesPerDay);

    const calorieData = {
        labels: uniqueDates,
        datasets: [
            {
                label: 'Calories',
                data: calorieValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const proteinData = {
        labels: uniqueDates,
        datasets: [
            {
                label: 'Proteins',
                data: proteinValues,
                fill: false,
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
            }
        ]
    };

    const latestData = lastSevenDaysData.length > 0 ? lastSevenDaysData[lastSevenDaysData.length - 1] : null;

    // Only proceed if latestData is not null
    let latestProteinSum = 0;
    let latestCalorieSum = 0;

    if (latestData) {
        latestProteinSum = totalProteinsPerDay[latestData.date] || 0;
        latestCalorieSum = totalCaloriesPerDay[latestData.date] || 0;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Macro Progress Component */}
            {!isLoading && currentGoal && (
                <MacroProgressDisplay 
                    currentProtein={todaysMacros.protein}
                    currentCarbs={todaysMacros.carbs}
                    currentFat={todaysMacros.fat}
                    currentCalories={todaysMacros.calories}
                    targetProtein={currentGoal.protein}
                    targetCarbs={currentGoal.carbs}
                    targetFat={currentGoal.fat}
                    targetCalories={currentGoal.calories}
                />
            )}
            
            {/* Historical Charts */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-3">Weekly Trends</h2>
                <div className='flex flex-row'>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Latest Date Total Protein: <span className="font-bold">{Math.round(latestProteinSum)}g</span></p>
                        <p className="text-sm font-medium">Latest Date Total Calories: <span className="font-bold">{Math.round(latestCalorieSum)}</span></p>
                    </div>
                    <div className="flex flex-row justify-between gap-4 w-full">
                        <div className="w-full lg:w-[48%] h-[150px] relative">
                            <Line data={proteinData} options={options} />
                        </div>
                        <div className="w-full lg:w-[48%] h-[150px] relative">
                            <Line data={calorieData} options={options} />
                        </div>
                    </div>
                </div>
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