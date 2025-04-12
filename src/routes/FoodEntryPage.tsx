import React from 'react';
import FoodEntryForm from '../components/FoodEntryForm';

const FoodEntryPage: React.FC = () => {
  return (
      <div className="mx-auto px-20 py-8 flex flex-col items-center">

        <div className="m-4 text-center">
          <p className="text-sm text-gray-600">
            Need to add multiple foods quickly? Use this form to add foods to your database.
            Once added, foods will be available in the dropdown on the main food input page.
          </p>
        </div>
        <FoodEntryForm />
      </div>
  );
};

export default FoodEntryPage; 