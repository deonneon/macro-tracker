import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DietProvider } from './DietContext';
import Layout from './components/Layout';
import QueryProvider from './components/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import SyncService from './services/SyncService';

// Auth components
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';
import AuthCallback from './components/AuthCallback';

// Route components
import Dashboard from './routes/Dashboard';
import FoodEntryPage from './routes/FoodEntryPage';
import DatabasePage from './routes/DatabasePage';
import ReportsPage from './routes/ReportsPage';
import GoalsPage from './routes/GoalsPage';
import MealTemplatesPage from './routes/MealTemplatesPage';
import DiaryPage from './routes/DiaryPage';

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
      <AuthProvider>
        <DietProvider>
          <BrowserRouter>
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="diary" element={<DiaryPage />} />
                  <Route path="food-entry" element={<FoodEntryPage />} />
                  <Route path="database" element={<DatabasePage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="meal-templates" element={<MealTemplatesPage />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </DietProvider>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
