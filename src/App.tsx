import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DietProvider } from './DietContext';
import Layout from './components/Layout';
import QueryProvider from './components/QueryProvider';
// We're not going to use CachingDietProvider directly now to avoid the context error
// import { CachingDietProvider } from './hooks/useDietContext';
import SyncService from './services/SyncService';

// Route components
import Dashboard from './routes/Dashboard';
import FoodEntryPage from './routes/FoodEntryPage';
import DatabasePage from './routes/DatabasePage';
import ReportsPage from './routes/ReportsPage';
import GoalsPage from './routes/GoalsPage';
import MealTemplatesPage from './routes/MealTemplatesPage';

const App: React.FC = () => {
  // Initialize sync service when app loads
  useEffect(() => {
    SyncService.init();
    
    return () => {
      // Perform any cleanup if needed
    };
  }, []);
  
  return (
    <QueryProvider>
      {/* Use the original DietProvider to maintain compatibility */}
      <DietProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="food-entry" element={<FoodEntryPage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="meal-templates" element={<MealTemplatesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DietProvider>
    </QueryProvider>
  );
};

export default App;
