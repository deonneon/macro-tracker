import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DietProvider } from './DietContext';
import Layout from './components/Layout';

// Route components
import Dashboard from './routes/Dashboard';
import FoodEntryPage from './routes/FoodEntryPage';
import DatabasePage from './routes/DatabasePage';
import QAPage from './routes/QAPage';
import GoalsPage from './routes/GoalsPage';
import MealTemplatesPage from './routes/MealTemplatesPage';

const App: React.FC = () => {
  return (
    <DietProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="food-entry" element={<FoodEntryPage />} />
            <Route path="database" element={<DatabasePage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="reports" element={<QAPage />} />
            <Route path="meal-templates" element={<MealTemplatesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DietProvider>
  );
};

export default App;
