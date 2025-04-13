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
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Function to ensure consistent data type for goal values
  const getGoalValue = (value: number | string | undefined): number => {
    if (typeof value === 'string') {
      return Number(value);
    }
    return value || 0;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: 0.2 
      }
    }
  };
  
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
                goalValue = getGoalValue(macroGoal.protein);
              } else if (macroType === 'carbs') {
                goalValue = getGoalValue(macroGoal.carbs);
              } else if (macroType === 'fat') {
                goalValue = getGoalValue(macroGoal.fat);
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
        yMin: getGoalValue(macroGoal.protein),
        yMax: getGoalValue(macroGoal.protein),
        borderColor: 'rgba(231, 76, 60, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Protein Goal: ${getGoalValue(macroGoal.protein)}g`,
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
        yMin: getGoalValue(macroGoal.carbs),
        yMax: getGoalValue(macroGoal.carbs),
        borderColor: 'rgba(46, 204, 113, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Carbs Goal: ${getGoalValue(macroGoal.carbs)}g`,
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
        yMin: getGoalValue(macroGoal.fat),
        yMax: getGoalValue(macroGoal.fat),
        borderColor: 'rgba(241, 196, 15, 0.5)',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
          content: `Fat Goal: ${getGoalValue(macroGoal.fat)}g`,
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
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex flex-wrap justify-between items-center mb-4"
        variants={itemVariants}
      >
        <motion.h3 
          className="text-lg font-semibold"
          variants={itemVariants}
        >
          {timePeriod === 'week' ? 'Weekly' : 'Monthly'} Macro Overview
        </motion.h3>
        
        <motion.div 
          className="flex space-x-2 text-sm" 
          variants={itemVariants}
        >
          <motion.button
            className={`px-3 py-1 rounded-full transition-colors ${timePeriod === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleTimePeriodChange('week')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Week
          </motion.button>
          <motion.button
            className={`px-3 py-1 rounded-full transition-colors ${timePeriod === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleTimePeriodChange('month')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Month
          </motion.button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="flex flex-wrap gap-2 mb-4" 
        variants={itemVariants}
      >
        <motion.button
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${showProtein ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
          onClick={() => setShowProtein(!showProtein)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Protein
        </motion.button>
        <motion.button
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${showCarbs ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
          onClick={() => setShowCarbs(!showCarbs)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Carbs
        </motion.button>
        <motion.button
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${showFat ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
          onClick={() => setShowFat(!showFat)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Fat
        </motion.button>
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={timePeriod} 
          style={{ height: `${height}px` }}
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Bar 
            data={data} 
            options={options} 
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default WeeklyMacroChart; 