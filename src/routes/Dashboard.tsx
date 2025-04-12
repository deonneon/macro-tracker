import React, { useContext } from 'react';
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

    if (!dietContext) {
        throw new Error('Dashboard must be used within a DietProvider');
    }

    const { dailyDiet } = dietContext;

    const today = new Date();
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
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Dashboard</h2>
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
    );
};

export default Dashboard; 