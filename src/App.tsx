import React, { useState } from 'react';
import './styles.css';
import { DietProvider } from './DietContext';
import Navbar from './Navbar';
import FoodInput from './FoodInput';
import DailyDietList from './DailyDietList';
import Dashboard from './Dashboard';
import DatabasePage from './DatabasePage';
import IconButton from './IconButton';
import QAPage from './QAPage';
import riceIcon from './icons/rice.png';
import bananaIcon from './icons/banana.png';
import { FaBars } from 'react-icons/fa'; // FaBars is a common hamburger icon in Font Awesome

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('main');

  return (
    <DietProvider>
      <div className="min-h-screen bg-white">
        <div className="hidden">
          <Navbar setCurrentPage={setCurrentPage} />
        </div>

        {currentPage === 'main' && (
          <div className="flex justify-between w-full h-screen overflow-hidden">
            <div className="w-[70%] h-screen overflow-y-auto px-[5%] py-8 flex flex-col">
              {/* Your journal pages go here */}
              <div className="w-full flex flex-col h-full overflow-y-auto">
                <div className="flex flex-col w-full h-full">
                  <div className="mb-auto">
                    <h1 className="text-2xl font-bold mb-6">Daily Macro Tracker</h1>
                    <FoodInput />
                    <DailyDietList />
                  </div>
                  <div className="mt-4">
                    <Dashboard />
                  </div>
                </div>
              </div>
          
            </div>
            <div className="flex-1 border-l border-gray-300 p-5 h-screen overflow-y-auto box-border max-w-[30%] justify-between flex flex-col">
              <div className="flex-grow overflow-y-auto mb-4">
                <DatabasePage />
              </div>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <IconButton foodName="rice" icon={riceIcon} />
                <IconButton foodName="banana" icon={bananaIcon} />
              </div>
              <div className="text-sm text-gray-600 text-center">
                Built by Deon
                <div className="inline-flex items-center justify-center w-6 h-6 ml-2 bg-gray-200 rounded-full">
                  <FaBars className="w-3 h-3 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'database' && <DatabasePage />}
        {currentPage === 'history' && <div><DailyDietList /></div>}
        {currentPage === 'qa' && <QAPage />}
      </div>
    </DietProvider>
  );
};

export default App;
