import React, { useState, useContext } from 'react';
import { DietContext } from '../DietContext';

interface MealTemplatesProps {
  date: string;
  mealType: string;
}

const MealTemplates: React.FC<MealTemplatesProps> = ({ date, mealType }) => {
  const dietContext = useContext(DietContext);
  const [selectedFoods, setSelectedFoods] = useState<Array<{ name: string; id: number; serving_size: number }>>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);

  if (!dietContext) {
    return <div>Loading...</div>;
  }

  const { 
    dailyDiet, 
    mealTemplates, 
    createMealTemplate, 
    updateMealTemplate, 
    deleteMealTemplate, 
    applyMealTemplate, 
    getMealTemplate 
  } = dietContext;

  // Filter dailyDiet to get today's entries for selecting foods for templates
  const todaysEntries = dailyDiet.filter(entry => entry.date === date);

  const handleFoodSelection = (foodId: number, foodName: string, servingSize: number) => {
    setSelectedFoods(prev => {
      // Check if food is already selected
      const exists = prev.some(food => food.id === foodId);
      if (exists) {
        // Remove if already selected
        return prev.filter(food => food.id !== foodId);
      } else {
        // Add if not selected
        return [...prev, { id: foodId, name: foodName, serving_size: servingSize }];
      }
    });
  };

  const handleCreateTemplate = async () => {
    if (templateName.trim() === '') {
      alert('Please enter a template name');
      return;
    }

    if (selectedFoods.length === 0) {
      alert('Please select at least one food');
      return;
    }

    try {
      // Get full food details for each selected food
      const foodsWithDetails = selectedFoods.map(selectedFood => {
        const foodEntry = todaysEntries.find(entry => entry.id === selectedFood.id);
        if (!foodEntry) {
          throw new Error(`Food with ID ${selectedFood.id} not found`);
        }
        return {
          id: foodEntry.id,
          name: foodEntry.name,
          protein: foodEntry.protein,
          carbs: foodEntry.carbs,
          fat: foodEntry.fat,
          calories: foodEntry.calories,
          serving_size: foodEntry.serving_size,
          unit: foodEntry.unit
        };
      });

      if (isEditMode && editTemplateId) {
        // Update existing template
        await updateMealTemplate(editTemplateId, {
          name: templateName,
          description: templateDescription,
          foods_json: foodsWithDetails.map(food => ({
            food_id: food.id,
            name: food.name,
            serving_size: food.serving_size,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            calories: food.calories,
            unit: food.unit
          }))
        });
      } else {
        // Create new template
        await createMealTemplate(templateName, templateDescription, foodsWithDetails);
      }

      // Reset form and close modal
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating/updating template:', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleApplyTemplate = async () => {
    if (selectedTemplateId === null) {
      alert('Please select a template');
      return;
    }

    try {
      await applyMealTemplate(selectedTemplateId, date, mealType);
      setIsApplyModalOpen(false);
      setSelectedTemplateId(null);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template. Please try again.');
    }
  };

  const handleEditTemplate = async (templateId: number) => {
    try {
      const template = await getMealTemplate(templateId);
      
      setEditTemplateId(templateId);
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setSelectedFoods(template.foods_json.map(food => ({
        id: food.food_id,
        name: food.name,
        serving_size: food.serving_size
      })));
      
      setIsEditMode(true);
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error('Error loading template for editing:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteMealTemplate(templateId);
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setSelectedFoods([]);
    setIsEditMode(false);
    setEditTemplateId(null);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Meal Templates</h2>
        <div className="space-x-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
          >
            Create Template
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={() => setIsApplyModalOpen(true)}
          >
            Apply Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-2 mt-4">
        {mealTemplates.length === 0 ? (
          <p className="text-gray-500">No templates available</p>
        ) : (
          mealTemplates.map(template => (
            <div 
              key={template.id} 
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {template.foods_json.length} food items
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => handleEditTemplate(template.id!)}
                >
                  Edit
                </button>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteTemplate(template.id!)}
                >
                  Delete
                </button>
                <button 
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                  onClick={() => {
                    setSelectedTemplateId(template.id!);
                    handleApplyTemplate();
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? 'Edit Template' : 'Create New Template'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="E.g., Breakfast, Protein Shake, etc."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full p-2 border rounded"
                value={templateDescription}
                onChange={e => setTemplateDescription(e.target.value)}
                placeholder="Add a description for this meal template"
                rows={2}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Foods for Template
              </label>
              {todaysEntries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No foods found for today. Add some foods to your diary first.
                </p>
              ) : (
                <div className="border rounded max-h-60 overflow-y-auto">
                  {todaysEntries.map(food => (
                    <div 
                      key={food.id}
                      className={`p-2 border-b flex items-center ${
                        selectedFoods.some(sf => sf.id === food.id) 
                          ? 'bg-blue-50' 
                          : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedFoods.some(sf => sf.id === food.id)}
                        onChange={() => handleFoodSelection(food.id, food.name, food.serving_size)}
                      />
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-gray-600">
                          {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                onClick={handleCreateTemplate}
                disabled={templateName.trim() === '' || selectedFoods.length === 0}
              >
                {isEditMode ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Apply Meal Template</h2>
            
            {mealTemplates.length === 0 ? (
              <p className="text-gray-500 mb-4">No templates available. Create one first.</p>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Template
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedTemplateId || ''}
                  onChange={e => setSelectedTemplateId(Number(e.target.value))}
                >
                  <option value="">-- Select a template --</option>
                  {mealTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                
                {selectedTemplateId && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p><strong>Template:</strong> {mealTemplates.find(t => t.id === selectedTemplateId)?.name}</p>
                    <p><strong>Foods:</strong> {mealTemplates.find(t => t.id === selectedTemplateId)?.foods_json.length} items</p>
                    <p><strong>Will be added to:</strong> {date} ({mealType})</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  setSelectedTemplateId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateId}
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealTemplates; 