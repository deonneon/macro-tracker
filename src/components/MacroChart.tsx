import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

const MacroChart: React.FC<MacroChartProps> = ({ protein, carbs, fat, calories }) => {
  // Calculate calories from macros
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  
  // Prepare data for pie chart
  const data = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [proteinCalories, carbsCalories, fatCalories],
        backgroundColor: [
          'rgba(231, 76, 60, 0.7)',  // Red for protein
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
            const percentage = Math.round((value / (proteinCalories + carbsCalories + fatCalories)) * 100);
            return `${label}: ${value} cal (${percentage}%)`;
          },
        },
      },
      title: {
        display: true,
        text: `Calorie Distribution (${calories} cal)`,
        font: {
          size: 14,
        },
      },
    },
  };
  
  // Calculate macronutrient percentages
  const totalCalories = proteinCalories + carbsCalories + fatCalories;
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100) || 0;
  const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100) || 0;
  const fatPercentage = Math.round((fatCalories / totalCalories) * 100) || 0;
  
  return (
    <div className="flex flex-col">
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center">
          <div className="font-medium text-gray-700">Protein</div>
          <div className="text-xs text-gray-500">
            {protein}g · {proteinCalories} cal
          </div>
          <div className="font-bold text-red-600">{proteinPercentage}%</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="font-medium text-gray-700">Carbs</div>
          <div className="text-xs text-gray-500">
            {carbs}g · {carbsCalories} cal
          </div>
          <div className="font-bold text-green-600">{carbsPercentage}%</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="font-medium text-gray-700">Fat</div>
          <div className="text-xs text-gray-500">
            {fat}g · {fatCalories} cal
          </div>
          <div className="font-bold text-yellow-600">{fatPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

export default MacroChart; 