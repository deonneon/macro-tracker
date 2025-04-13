import React, { useEffect } from 'react';

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
  // Debug log when props change
  useEffect(() => {
    console.log('MacroProgressDisplay rendered with props:', {
      currentProtein,
      currentCarbs,
      currentFat,
      currentCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetCalories
    });
  }, [currentProtein, currentCarbs, currentFat, currentCalories, targetProtein, targetCarbs, targetFat, targetCalories]);

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

  // Progress bar component
  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
      <div 
        className={`h-2.5 rounded-full ${color}`} 
        style={{ width: `${Math.min(percentage, 100)}%` }}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      ></div>
    </div>
  );

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Today's Macros Progress</h3>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Protein Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Protein</span>
            <span className="text-xs sm:text-sm font-medium">
              {Math.round(currentProtein)}g / {targetProtein}g 
              <span className="hidden xs:inline"> ({proteinPercentage}%)</span>
            </span>
          </div>
          <ProgressBar 
            percentage={proteinPercentage} 
            color={getColorClass(proteinPercentage)} 
          />
        </div>
        
        {/* Carbs Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Carbs</span>
            <span className="text-xs sm:text-sm font-medium">
              {Math.round(currentCarbs)}g / {targetCarbs}g 
              <span className="hidden xs:inline"> ({carbsPercentage}%)</span>
            </span>
          </div>
          <ProgressBar 
            percentage={carbsPercentage} 
            color={getColorClass(carbsPercentage)} 
          />
        </div>
        
        {/* Fat Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Fat</span>
            <span className="text-xs sm:text-sm font-medium">
              {Math.round(currentFat)}g / {targetFat}g 
              <span className="hidden xs:inline"> ({fatPercentage}%)</span>
            </span>
          </div>
          <ProgressBar 
            percentage={fatPercentage} 
            color={getColorClass(fatPercentage)} 
          />
        </div>
        
        {/* Calories Summary */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium">Total Calories</span>
            <span className="text-xs sm:text-sm font-medium">
              {Math.round(currentCalories)} / {targetCalories} cal 
              <span className="hidden xs:inline"> ({caloriesPercentage}%)</span>
            </span>
          </div>
          <ProgressBar 
            percentage={caloriesPercentage} 
            color={getColorClass(caloriesPercentage)} 
          />
        </div>
      </div>
      
      {/* Small Screen Percentage Display */}
      <div className="grid grid-cols-4 mt-3 xs:hidden">
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
      </div>
    </div>
  );
};

export default MacroProgressDisplay; 