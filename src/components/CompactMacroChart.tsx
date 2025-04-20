import React, { useContext, useEffect, useState, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DietContext } from '../DietContext';
import { format, subDays, isSameDay } from 'date-fns';
import { MacroGoal } from '../types/goals';
import { goalsTable, dailyDietTable } from '../lib/supabase';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
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
  const [caloriesPerDay, setCaloriesPerDay] = useState<number[]>([]);
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
    const datesArr: string[] = [];
    const dateLabelsArr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      datesArr.push(formattedDate);
      if (isSameDay(date, today)) {
        dateLabelsArr.push('Today');
      } else {
        dateLabelsArr.push(format(date, 'E'));
      }
    }
    return { dates: datesArr, dateLabels: dateLabelsArr };
  }, []); 
  
  // Fetch data for the period
  useEffect(() => {
    const fetchDataInBatches = async (datesToFetch: string[]) => {
      const proteinPerDay: number[] = Array(datesToFetch.length).fill(0);
      const carbsPerDay: number[] = Array(datesToFetch.length).fill(0);
      const fatPerDay: number[] = Array(datesToFetch.length).fill(0);
      const caloriesPerDay: number[] = Array(datesToFetch.length).fill(0);
      
      try {
        const batchPromises = datesToFetch.map((date, index) => 
          dailyDietTable.getByDate(date)
            .then(dailyEntries => {
              if (Array.isArray(dailyEntries)) {
                let dailyTotals = dailyEntries.reduce((acc, entry) => ({
                  protein: acc.protein + (entry.protein || 0),
                  carbs: acc.carbs + (entry.carbs || 0),
                  fat: acc.fat + (entry.fat || 0),
                  calories: acc.calories + (entry.calories || 0),
                  hasCalories: acc.hasCalories || (typeof entry.calories === 'number')
                }), { protein: 0, carbs: 0, fat: 0, calories: 0, hasCalories: false });
                
                proteinPerDay[index] = Math.round(dailyTotals.protein);
                carbsPerDay[index] = Math.round(dailyTotals.carbs);
                fatPerDay[index] = Math.round(dailyTotals.fat);
                
                // Use calories from DB if available, else calculate
                if (dailyTotals.hasCalories) {
                  caloriesPerDay[index] = Math.round(dailyTotals.calories);
                } else {
                  caloriesPerDay[index] = Math.round(
                    dailyTotals.protein * 4 + dailyTotals.carbs * 4 + dailyTotals.fat * 9
                  );
                }
              }
            })
            .catch(error => {
              console.warn(`Error fetching data for ${date}:`, error.message || error);
            })
        );
        
        await Promise.all(batchPromises);
        return { proteinPerDay, carbsPerDay, fatPerDay, caloriesPerDay };
      } catch (error) {
        console.error('Error fetching period data:', error);
        return { proteinPerDay, carbsPerDay, fatPerDay, caloriesPerDay };
      }
    };
    
    const fetchPeriodData = async () => {
      setIsLoading(true);
      try {
        const fetchedData = await fetchDataInBatches(dates);
        setPeriodData({
          proteinPerDay: fetchedData.proteinPerDay,
          carbsPerDay: fetchedData.carbsPerDay,
          fatPerDay: fetchedData.fatPerDay
        });
        setCaloriesPerDay(fetchedData.caloriesPerDay);
      } catch (error) {
        console.error('Error fetching period data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [dates]);
  
  // Prepare chart data for protein
  const proteinData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Protein',
        data: periodData.proteinPerDay,
        showLine: false,
        borderColor: 'rgba(231, 76, 60, 0.9)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: (ctx: { dataIndex: number }) => {
          const index = ctx.dataIndex;
          // Larger points for first and last items
          return index === 0 || index === periodData.proteinPerDay.length - 1 ? 3 : 2.5;
        },
        pointBackgroundColor: 'rgba(231, 76, 60, 0.9)',
        pointBorderColor: 'rgba(231, 76, 60, 1)',
        pointBorderWidth: 1,
      }
    ]
  };
  
  // Prepare chart data for calories
  const caloriesData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Calories',
        data: caloriesPerDay,
        showLine: false,
        borderColor: 'rgba(52, 152, 219, 0.9)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: (ctx: { dataIndex: number }) => {
          const index = ctx.dataIndex;
          // Larger points for first and last items
          return index === 0 || index === caloriesPerDay.length - 1 ? 3 : 2.5;
        },
        pointBackgroundColor: 'rgba(52, 152, 219, 0.9)',
        pointBorderColor: 'rgba(52, 152, 219, 1)',
        pointBorderWidth: 1,
      }
    ]
  };
  
  // Chart options for both charts (reuse, but allow label override)
  const baseOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 4,
        bottom: 2
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          font: {
            size: 10,
            family: "'Roboto', sans-serif"
          },
          autoSkip: true,
          maxTicksLimit: 7
        }
      },
      y: {
        stacked: false,
        grid: { display: false },
        display: false,
      }
    },
    plugins: {
      title: { display: false },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
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
            if (label === 'Protein') {
              let percentOfGoal = '';
              if (macroGoal) {
                const goalValue = getGoalValue(macroGoal.protein);
                if (goalValue) {
                  const percentage = Math.round((value / goalValue) * 100);
                  percentOfGoal = ` (${percentage}% of goal)`;
                }
              }
              return `${label}: ${value}g${percentOfGoal}`;
            } else if (label === 'Calories') {
              let percentOfGoal = '';
              if (macroGoal) {
                const goalValue = getGoalValue(macroGoal.calories);
                if (goalValue) {
                  const percentage = Math.round((value / goalValue) * 100);
                  percentOfGoal = ` (${percentage}% of goal)`;
                }
              }
              return `${label}: ${value} kcal${percentOfGoal}`;
            }
            return `${label}: ${value}`;
          }
        }
      },
      // @ts-ignore
      datalabels: {
        anchor: 'end',
        align: 'bottom',
        font: { weight: 'bold', size: 10 },
        color: 'transparent',
        formatter: (value: number) => value,
        display: true,
        margin: 0,
      } as any
    },
    animation: { duration: 500 }
  };
  
  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Last 7 Days Macros</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className='bg-red-500/90 rounded-full w-2 h-2'></span><span className="text-xs text-gray-500">Protein</span>
            <span className='bg-blue-500/90 rounded-full w-2 h-2'></span><span className="text-xs text-gray-500">Calories</span>
          </div>
        </div>
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
        <div className="flex gap-2 sm:gap-4 md:gap-8 items-stretch" style={{ height: `${height}px` }}>
          <div
            className="w-1/2 bg-white rounded-lg shadow p-1 sm:p-3 md:p-4 flex flex-col justify-between overflow-hidden"
            aria-label="Protein chart card"
            tabIndex={0}
          >
            <motion.div
              className="flex-1 flex items-end w-full"
              variants={chartVariants}
              initial="hidden"
              animate="visible"
            >
              <Line data={proteinData} options={baseOptions} />
            </motion.div>
          </div>
          <div
            className="w-1/2 bg-white rounded-lg shadow p-1 sm:p-3 md:p-4 flex flex-col justify-between overflow-hidden"
            aria-label="Calories chart card"
            tabIndex={0}
          >
            <motion.div
              className="flex-1 flex items-end w-full"
              variants={chartVariants}
              initial="hidden"
              animate="visible"
            >
              <Line data={caloriesData} options={baseOptions} />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactMacroChart; 