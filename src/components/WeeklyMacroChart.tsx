import React, { useContext, useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  BarElement,
  ChartOptions
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar } from 'react-chartjs-2';
import { DietContext } from '../DietContext';
import { format, subDays, isAfter, subMonths } from 'date-fns';
import { MacroGoal } from '../types/goals';
import { goalsTable } from '../lib/supabase';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

type TimePeriod = 'week' | 'month';

interface WeeklyMacroChartProps {
  height?: number;
}

const WeeklyMacroChart: React.FC<WeeklyMacroChartProps> = ({ height = 300 }) => {
  const dietContext = useContext(DietContext);
  const [macroGoal, setMacroGoal] = useState<MacroGoal | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showProtein, setShowProtein] = useState(true);
  const [showCarbs, setShowCarbs] = useState(true);
  const [showFat, setShowFat] = useState(true);
  
  if (!dietContext) {
    throw new Error('WeeklyMacroChart must be used within a DietProvider');
  }
  
  const { dailyDiet } = dietContext;
  
  // Fetch the latest goal
  useEffect(() => {
    const fetchLatestGoal = async () => {
      try {
        const latestGoal = await goalsTable.getLatest();
        setMacroGoal(latestGoal);
      } catch (error) {
        console.error('Error fetching latest goal:', error);
      }
    };

    fetchLatestGoal();
  }, []);

  // Generate dates for the selected time period
  const generateDates = () => {
    const today = new Date();
    const dates = [];
    const dateLabels = [];
    
    // Number of days to include
    const daysToInclude = timePeriod === 'week' ? 7 : 30;
    
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      // Format date label based on time period
      const dayLabel = timePeriod === 'week' 
        ? format(date, 'E d') // "Mon 1" for week
        : format(date, 'MMM d'); // "Jan 1" for month
      
      dates.push(formattedDate);
      dateLabels.push(dayLabel);
    }
    
    return { dates, dateLabels };
  };
  
  const { dates, dateLabels } = generateDates();
  
  // Aggregate macros per day
  const calculateDailyMacros = () => {
    const proteinPerDay: number[] = [];
    const carbsPerDay: number[] = [];
    const fatPerDay: number[] = [];
    
    dates.forEach(date => {
      const dailyEntries = dailyDiet.filter(entry => entry.date === date);
      
      const dailyTotals = dailyEntries.reduce((acc, entry) => ({
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fat: acc.fat + (entry.fat || 0)
      }), { protein: 0, carbs: 0, fat: 0 });
      
      proteinPerDay.push(Math.round(dailyTotals.protein));
      carbsPerDay.push(Math.round(dailyTotals.carbs));
      fatPerDay.push(Math.round(dailyTotals.fat));
    });
    
    return { proteinPerDay, carbsPerDay, fatPerDay };
  };
  
  const { proteinPerDay, carbsPerDay, fatPerDay } = calculateDailyMacros();
  
  // Calculate visible datasets
  const getVisibleDatasets = () => {
    const datasets = [];
    
    if (showProtein) {
      datasets.push({
        label: 'Protein',
        data: proteinPerDay,
        backgroundColor: 'rgba(231, 76, 60, 0.7)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1,
      });
    }
    
    if (showCarbs) {
      datasets.push({
        label: 'Carbs',
        data: carbsPerDay,
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      });
    }
    
    if (showFat) {
      datasets.push({
        label: 'Fat',
        data: fatPerDay,
        backgroundColor: 'rgba(241, 196, 15, 0.7)',
        borderColor: 'rgba(241, 196, 15, 1)',
        borderWidth: 1,
      });
    }
    
    return datasets;
  };
  
  // Prepare chart data
  const data = {
    labels: dateLabels,
    datasets: getVisibleDatasets()
  };
  
  // Chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: timePeriod === 'week' ? 'Day of Week' : 'Day of Month'
        },
        grid: {
          display: false
        }
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: 'Macros (g)'
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: timePeriod === 'week' ? 'Weekly Macro Intake' : 'Monthly Macro Intake',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        },
        onClick: () => {} // Disable default legend click behavior, we'll use our custom toggles
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 3,
        callbacks: {
          title: (tooltipItems) => {
            // Format the date to show "Day, Month Date"
            const itemIndex = tooltipItems[0].dataIndex;
            const date = dates[itemIndex];
            const parsedDate = new Date(date);
            return format(parsedDate, 'EEEE, MMMM d, yyyy');
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            let percentOfGoal = '';
            if (macroGoal) {
              // Calculate percentage of goal
              const macroType = label.toLowerCase();
              let goalValue = 0;
              
              if (macroType === 'protein') {
                goalValue = macroGoal.protein_goal;
              } else if (macroType === 'carbs') {
                goalValue = macroGoal.carbs_goal;
              } else if (macroType === 'fat') {
                goalValue = macroGoal.fat_goal;
              }
              
              if (goalValue) {
                const percentage = Math.round((value / goalValue) * 100);
                percentOfGoal = ` (${percentage}% of goal)`;
              }
            }
            
            return `${label}: ${value}g${percentOfGoal}`;
          },
          afterBody: (tooltipItems) => {
            const dailySums = tooltipItems.reduce((sums, item) => {
              const value = item.parsed.y;
              const label = item.dataset.label?.toLowerCase() || '';
              
              if (label === 'protein') sums.protein = value;
              if (label === 'carbs') sums.carbs = value;
              if (label === 'fat') sums.fat = value;
              
              return sums;
            }, { protein: 0, carbs: 0, fat: 0 });
            
            // Calculate total calories
            const calories = 
              (dailySums.protein * 4) + 
              (dailySums.carbs * 4) + 
              (dailySums.fat * 9);
              
            return [`Total Calories: ${Math.round(calories)} kcal`];
          }
        }
      }
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart'
    },
    hover: {
      // Remove the animationDuration property as it's not supported
    }
  };
  
  // Add annotation plugins for goal lines if we have goals
  if (macroGoal) {
    const annotations: Record<string, any> = {};
    
    // Protein goal line
    if (showProtein) {
      annotations.proteinGoal = {
        type: 'line',
        yMin: macroGoal.protein_goal,
        yMax: macroGoal.protein_goal,
        borderColor: 'rgba(231, 76, 60, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Protein Goal: ${macroGoal.protein_goal}g`,
          enabled: true,
          position: 'end',
          backgroundColor: 'rgba(231, 76, 60, 0.7)',
          font: {
            size: 10
          }
        }
      };
    }
    
    // Carbs goal line
    if (showCarbs) {
      annotations.carbsGoal = {
        type: 'line',
        yMin: macroGoal.carbs_goal,
        yMax: macroGoal.carbs_goal,
        borderColor: 'rgba(46, 204, 113, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Carbs Goal: ${macroGoal.carbs_goal}g`,
          enabled: true,
          position: 'end',
          backgroundColor: 'rgba(46, 204, 113, 0.7)',
          font: {
            size: 10
          }
        }
      };
    }
    
    // Fat goal line
    if (showFat) {
      annotations.fatGoal = {
        type: 'line',
        yMin: macroGoal.fat_goal,
        yMax: macroGoal.fat_goal,
        borderColor: 'rgba(241, 196, 15, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Fat Goal: ${macroGoal.fat_goal}g`,
          enabled: true,
          position: 'end',
          backgroundColor: 'rgba(241, 196, 15, 0.7)',
          font: {
            size: 10
          }
        }
      };
    }
    
    // Add annotations plugin
    options.plugins = {
      ...options.plugins,
      annotation: {
        annotations
      }
    };
  }
  
  // Toggle handlers
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {/* Controls Bar */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        {/* Time Period Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Time Period:</span>
          <div className="flex border rounded-md overflow-hidden">
            <button 
              onClick={() => handleTimePeriodChange('week')}
              className={`px-3 py-1 text-sm ${
                timePeriod === 'week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Show weekly data"
            >
              Week
            </button>
            <button 
              onClick={() => handleTimePeriodChange('month')}
              className={`px-3 py-1 text-sm ${
                timePeriod === 'month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Show monthly data"
            >
              Month
            </button>
          </div>
        </div>
        
        {/* Macro Toggles */}
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setShowProtein(!showProtein)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm border ${
              showProtein 
                ? 'bg-red-100 border-red-300 text-red-800' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`${showProtein ? 'Hide' : 'Show'} protein data`}
            aria-pressed={showProtein}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600 ${showProtein ? 'opacity-100' : 'opacity-30'}`}></div>
            <span>Protein</span>
          </button>
          
          <button
            onClick={() => setShowCarbs(!showCarbs)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm border ${
              showCarbs 
                ? 'bg-green-100 border-green-300 text-green-800' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`${showCarbs ? 'Hide' : 'Show'} carbs data`}
            aria-pressed={showCarbs}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600 ${showCarbs ? 'opacity-100' : 'opacity-30'}`}></div>
            <span>Carbs</span>
          </button>
          
          <button
            onClick={() => setShowFat(!showFat)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm border ${
              showFat 
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`${showFat ? 'Hide' : 'Show'} fat data`}
            aria-pressed={showFat}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-600 ${showFat ? 'opacity-100' : 'opacity-30'}`}></div>
            <span>Fat</span>
          </button>
        </div>
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {(!showProtein && !showCarbs && !showFat) ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Please select at least one macro to display
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
      
      {/* Legend Note */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>Dashed lines represent your daily macro goals. Click toggles above to show/hide macros.</p>
        {timePeriod === 'month' && (
          <p className="mt-1">Showing data for the past 30 days. Hover over bars for detailed information.</p>
        )}
      </div>
    </div>
  );
};

export default WeeklyMacroChart; 