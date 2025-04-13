import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface MacroDistributionChartProps {
  data: any[];
}

const MacroDistributionChart: React.FC<MacroDistributionChartProps> = ({ data }) => {
  // Calculate total macros for the selected period
  const macroTotals = useMemo(() => {
    return data.reduce(
      (totals, entry) => {
        return {
          protein: totals.protein + (entry.protein || 0),
          carbs: totals.carbs + (entry.carbs || 0),
          fat: totals.fat + (entry.fat || 0),
          calories: totals.calories + (entry.calories || 0),
        };
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [data]);

  // Calculate calories from macros
  const proteinCalories = macroTotals.protein * 4;
  const carbsCalories = macroTotals.carbs * 4;
  const fatCalories = macroTotals.fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  // Calculate percentages
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100) || 0;
  const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100) || 0;
  const fatPercentage = Math.round((fatCalories / totalCalories) * 100) || 0;

  // Prepare data for pie chart
  const chartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [proteinCalories, carbsCalories, fatCalories],
        backgroundColor: [
          'rgba(231, 76, 60, 0.7)', // Red for protein
          'rgba(46, 204, 113, 0.7)', // Green for carbs
          'rgba(241, 196, 15, 0.7)', // Yellow for fat
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = Math.round((value / totalCalories) * 100);
            return `${label}: ${value} cal (${percentage}%)`;
          },
        },
      },
      title: {
        display: true,
        text: `Calorie Distribution (${Math.round(totalCalories)} cal)`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  };

  return (
    <div className="flex flex-col">
      <div className="h-64 md:h-80 mb-4">
        <Pie data={chartData} options={options} />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-red-100 p-3 rounded-lg">
          <p className="text-red-700 font-bold text-xl">{proteinPercentage}%</p>
          <p className="text-gray-700 text-sm">Protein</p>
          <p className="text-gray-500 text-xs">{macroTotals.protein.toFixed(1)}g</p>
        </div>
        <div className="bg-green-100 p-3 rounded-lg">
          <p className="text-green-700 font-bold text-xl">{carbsPercentage}%</p>
          <p className="text-gray-700 text-sm">Carbs</p>
          <p className="text-gray-500 text-xs">{macroTotals.carbs.toFixed(1)}g</p>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg">
          <p className="text-yellow-700 font-bold text-xl">{fatPercentage}%</p>
          <p className="text-gray-700 text-sm">Fat</p>
          <p className="text-gray-500 text-xs">{macroTotals.fat.toFixed(1)}g</p>
        </div>
      </div>
    </div>
  );
};

export default MacroDistributionChart; 