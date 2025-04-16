import React, { useContext, useEffect, useState, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DietContext } from '../DietContext';
import { format, subDays } from 'date-fns';
import { MacroGoal } from '../types/goals';
import { goalsTable, dailyDietTable } from '../lib/supabase';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CompactMacroChartProps {
  height?: number;
}

const CompactMacroChart: React.FC<CompactMacroChartProps> = ({ height = 180 }) => {
  const dietContext = useContext(DietContext);
  const [macroGoal, setMacroGoal] = useState<MacroGoal | null>(null);
  const [periodData, setPeriodData] = useState<{
    proteinPerDay: number[];
    carbsPerDay: number[];
    fatPerDay: number[];
  }>({ proteinPerDay: [], carbsPerDay: [], fatPerDay: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  if (!dietContext) {
    throw new Error('CompactMacroChart must be used within a DietProvider');
  }
  
  // Function to ensure consistent data type for goal values
  const getGoalValue = (value: number | string | undefined): number => {
    if (typeof value === 'string') {
      return Number(value);
    }
    return value || 0;
  };
  
  // Animation variants
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15
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

  // Generate dates for the last 5 days, memoized
  const { dates, dateLabels } = useMemo(() => {
    const today = new Date();
    const datesArr = [];
    const dateLabelsArr = [];
    
    // Only show last 5 days for compact view
    for (let i = 4; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayLabel = format(date, 'E'); // Just day names for compact view (Mon, Tue, etc)
      
      datesArr.push(formattedDate);
      dateLabelsArr.push(dayLabel);
    }
    
    return { dates: datesArr, dateLabels: dateLabelsArr };
  }, []); 
  
  // Fetch data for the period
  useEffect(() => {
    const fetchDataInBatches = async (datesToFetch: string[]) => {
      const proteinPerDay: number[] = Array(datesToFetch.length).fill(0);
      const carbsPerDay: number[] = Array(datesToFetch.length).fill(0);
      const fatPerDay: number[] = Array(datesToFetch.length).fill(0);
      
      try {
        // Process each date
        const batchPromises = datesToFetch.map((date, index) => 
          dailyDietTable.getByDate(date)
            .then(dailyEntries => {
              if (Array.isArray(dailyEntries)) {
                const dailyTotals = dailyEntries.reduce((acc, entry) => ({
                  protein: acc.protein + (entry.protein || 0),
                  carbs: acc.carbs + (entry.carbs || 0),
                  fat: acc.fat + (entry.fat || 0)
                }), { protein: 0, carbs: 0, fat: 0 });
                
                proteinPerDay[index] = Math.round(dailyTotals.protein);
                carbsPerDay[index] = Math.round(dailyTotals.carbs);
                fatPerDay[index] = Math.round(dailyTotals.fat);
              }
            })
            .catch(error => {
              console.warn(`Error fetching data for ${date}:`, error.message || error);
            })
        );
        
        await Promise.all(batchPromises);
        return { proteinPerDay, carbsPerDay, fatPerDay };
      } catch (error) {
        console.error('Error fetching period data:', error);
        return { proteinPerDay, carbsPerDay, fatPerDay };
      }
    };
    
    const fetchPeriodData = async () => {
      setIsLoading(true);
      try {
        const fetchedData = await fetchDataInBatches(dates);
        setPeriodData(fetchedData);
      } catch (error) {
        console.error('Error fetching period data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [dates]);
  
  // Prepare chart data
  const data = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Protein',
        data: periodData.proteinPerDay,
        backgroundColor: 'rgba(231, 76, 60, 0.7)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1,
      },
      {
        label: 'Carbs',
        data: periodData.carbsPerDay,
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      },
      {
        label: 'Fat',
        data: periodData.fatPerDay,
        backgroundColor: 'rgba(241, 196, 15, 0.7)',
        borderColor: 'rgba(241, 196, 15, 1)',
        borderWidth: 1,
      }
    ]
  };
  
  // Chart options - simplified for compact view
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false
        }
      },
      y: {
        stacked: false,
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
        display: false
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 10,
          boxHeight: 8,
          boxWidth: 8,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        },
        padding: 8,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        callbacks: {
          title: (tooltipItems) => {
            const itemIndex = tooltipItems[0].dataIndex;
            const date = dates[itemIndex];
            const parsedDate = new Date(date);
            return format(parsedDate, 'EEEE, MMMM d');
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
          }
        }
      }
    },
    animation: {
      duration: 500
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Last 5 Days Macros</h3>
      </div>
      
      {isLoading ? (
        <div 
          style={{ height: `${height}px` }}
          className="h-full flex items-center justify-center"
        >
          <div className="text-gray-400 flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 mb-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      ) : (
        <motion.div 
          style={{ height: `${height}px` }}
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="pt-1"
        >
          <Bar 
            data={data} 
            options={options} 
          />
        </motion.div>
      )}
    </div>
  );
};

export default CompactMacroChart; 