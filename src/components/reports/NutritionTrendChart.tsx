import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions,
  Filler
} from 'chart.js';
import { MacroGoal } from '../../types/goals';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface NutritionTrendChartProps {
  data: any[];
  macroGoal: MacroGoal | null;
}

const NutritionTrendChart: React.FC<NutritionTrendChartProps> = ({ 
  data,
  macroGoal
}) => {
  const [showProtein, setShowProtein] = useState<boolean>(true);
  const [showCarbs, setShowCarbs] = useState<boolean>(true);
  const [showFat, setShowFat] = useState<boolean>(true);
  const [showCalories, setShowCalories] = useState<boolean>(false);
  
  // Process data by grouping it by date
  const processedData = useMemo(() => {
    const groupedByDate: Record<string, {
      date: string;
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
    }> = {};
    
    data.forEach(entry => {
      const date = entry.date;
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          protein: 0,
          carbs: 0,
          fat: 0,
          calories: 0
        };
      }
      
      groupedByDate[date].protein += entry.protein || 0;
      groupedByDate[date].carbs += entry.carbs || 0;
      groupedByDate[date].fat += entry.fat || 0;
      groupedByDate[date].calories += entry.calories || 0;
    });
    
    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }, [data]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const dates = processedData.map(entry => format(parseISO(entry.date), 'MMM d'));
    
    const datasets = [];
    
    if (showProtein) {
      datasets.push({
        label: 'Protein (g)',
        data: processedData.map(entry => entry.protein),
        borderColor: 'rgba(231, 76, 60, 1)',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      });
    }
    
    if (showCarbs) {
      datasets.push({
        label: 'Carbs (g)',
        data: processedData.map(entry => entry.carbs),
        borderColor: 'rgba(46, 204, 113, 1)',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      });
    }
    
    if (showFat) {
      datasets.push({
        label: 'Fat (g)',
        data: processedData.map(entry => entry.fat),
        borderColor: 'rgba(241, 196, 15, 1)',
        backgroundColor: 'rgba(241, 196, 15, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      });
    }
    
    if (showCalories) {
      datasets.push({
        label: 'Calories (kcal)',
        data: processedData.map(entry => entry.calories),
        borderColor: 'rgba(52, 152, 219, 1)',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      });
    }
    
    return {
      labels: dates,
      datasets
    };
  }, [processedData, showProtein, showCarbs, showFat, showCalories]);
  
  // Prepare chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    // Create the base scales object
    const scales: any = {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'Grams (g)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        beginAtZero: true
      }
    };
    
    // Only add y1 axis if calories are shown
    if (showCalories) {
      scales.y1 = {
        position: 'right',
        title: {
          display: true,
          text: 'Calories (kcal)'
        },
        grid: {
          drawOnChartArea: false
        },
        beginAtZero: true
      };
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context) => {
              if (context[0]) {
                const index = context[0].dataIndex;
                const date = processedData[index].date;
                return format(parseISO(date), 'EEEE, MMMM d, yyyy');
              }
              return '';
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Nutrition Trends Over Time',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: {
            top: 10,
            bottom: 20
          }
        }
      }
    };
  }, [processedData, showCalories]);
  
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <button
          onClick={() => setShowProtein(!showProtein)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showProtein
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={showProtein ? 'Hide protein data' : 'Show protein data'}
          tabIndex={0}
        >
          Protein
        </button>
        <button
          onClick={() => setShowCarbs(!showCarbs)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showCarbs
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={showCarbs ? 'Hide carbs data' : 'Show carbs data'}
          tabIndex={0}
        >
          Carbs
        </button>
        <button
          onClick={() => setShowFat(!showFat)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showFat
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={showFat ? 'Hide fat data' : 'Show fat data'}
          tabIndex={0}
        >
          Fat
        </button>
        <button
          onClick={() => setShowCalories(!showCalories)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showCalories
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={showCalories ? 'Hide calories data' : 'Show calories data'}
          tabIndex={0}
        >
          Calories
        </button>
      </div>
      
      <div className="h-80 md:h-96">
        {processedData.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <p className="text-gray-500">No data available for the selected date range</p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Click on the legend items to toggle visibility. Hover over the chart to see daily details.</p>
        {macroGoal && (
          <p className="mt-1">
            Your current goals: {macroGoal.protein}g protein, {macroGoal.carbs}g carbs, {macroGoal.fat}g fat, {macroGoal.calories} calories
          </p>
        )}
      </div>
    </div>
  );
};

export default NutritionTrendChart; 