import { motion } from 'framer-motion';

interface MacroProgressDisplayProps {
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  currentCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetCalories: number;
}

const MacroProgressDisplay: React.FC<MacroProgressDisplayProps> = ({
  currentProtein,
  currentCarbs,
  currentFat,
  currentCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  targetCalories
}) => {

  // Calculate percentages
  const proteinPercentage = Math.min(Math.round((currentProtein / targetProtein) * 100) || 0, 200);
  const carbsPercentage = Math.min(Math.round((currentCarbs / targetCarbs) * 100) || 0, 200);
  const fatPercentage = Math.min(Math.round((currentFat / targetFat) * 100) || 0, 200);
  const caloriesPercentage = Math.min(Math.round((currentCalories / targetCalories) * 100) || 0, 200);

  // Get color classes based on percentage (under, meeting, or exceeding targets)
  const getColorClass = (percentage: number): string => {
    if (percentage < 80) return 'bg-blue-500'; // Under target
    if (percentage <= 105) return 'bg-green-500'; // Meeting target (80-105%)
    return 'bg-red-500'; // Exceeding target (>105%)
  };

  // Progress bar component with animation
  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
      <motion.div 
        className={`h-2.5 rounded-full ${color}`} 
        style={{ width: '0%' }}
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      ></motion.div>
    </div>
  );

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h3 
        className="text-base sm:text-lg font-semibold mb-2 sm:mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        Today's Macros Progress
      </motion.h3>
      
      <motion.div 
        className="space-y-3 sm:space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Protein Progress */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Protein</span>
            <motion.span 
              className="text-xs sm:text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {Math.round(currentProtein)}g / {targetProtein}g 
              <span className="hidden xs:inline"> ({proteinPercentage}%)</span>
            </motion.span>
          </div>
          <ProgressBar 
            percentage={proteinPercentage} 
            color={getColorClass(proteinPercentage)} 
          />
        </motion.div>
        
        {/* Carbs Progress */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Carbs</span>
            <motion.span 
              className="text-xs sm:text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {Math.round(currentCarbs)}g / {targetCarbs}g 
              <span className="hidden xs:inline"> ({carbsPercentage}%)</span>
            </motion.span>
          </div>
          <ProgressBar 
            percentage={carbsPercentage} 
            color={getColorClass(carbsPercentage)} 
          />
        </motion.div>
        
        {/* Fat Progress */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Fat</span>
            <motion.span 
              className="text-xs sm:text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {Math.round(currentFat)}g / {targetFat}g 
              <span className="hidden xs:inline"> ({fatPercentage}%)</span>
            </motion.span>
          </div>
          <ProgressBar 
            percentage={fatPercentage} 
            color={getColorClass(fatPercentage)} 
          />
        </motion.div>
        
        {/* Calories Summary */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Total Calories</span>
            <motion.span 
              className="text-xs sm:text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {Math.round(currentCalories)} / {targetCalories} cal 
              <span className="hidden xs:inline"> ({caloriesPercentage}%)</span>
            </motion.span>
          </div>
          <ProgressBar 
            percentage={caloriesPercentage} 
            color={getColorClass(caloriesPercentage)} 
          />
        </motion.div>
      </motion.div>
      
      {/* Small Screen Percentage Display */}
      <motion.div 
        className="grid grid-cols-4 mt-3 xs:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="text-center">
          <span className="text-xs font-medium">{proteinPercentage}%</span>
        </div>
        <div className="text-center">
          <span className="text-xs font-medium">{carbsPercentage}%</span>
        </div>
        <div className="text-center">
          <span className="text-xs font-medium">{fatPercentage}%</span>
        </div>
        <div className="text-center">
          <span className="text-xs font-medium">{caloriesPercentage}%</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MacroProgressDisplay; 