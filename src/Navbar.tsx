import React from 'react';

interface NavbarProps {
    setCurrentPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setCurrentPage }) => {
    return (
        <nav className="flex items-center justify-center p-4 bg-white shadow-md">
            <div className="flex space-x-4">
                <button 
                    onClick={() => setCurrentPage('main')}
                    className="px-4 py-2 font-medium text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                    Main Page
                </button>
                <button 
                    onClick={() => setCurrentPage('history')}
                    className="px-4 py-2 font-medium text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                    Log History
                </button>
                <button 
                    onClick={() => setCurrentPage('database')}
                    className="px-4 py-2 font-medium text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                    Database
                </button>
                <button 
                    onClick={() => setCurrentPage('qa')}
                    className="px-4 py-2 font-medium text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                    Q&A
                </button>
            </div>
        </nav>
    );
};

export default Navbar; 