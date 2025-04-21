import React, { useState, useContext, useEffect } from 'react';
import { DietContext } from '../DietContext';
import { MealTemplate } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faSearch, faFilter, faEdit, faTrash, 
  faInfoCircle, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';

const MealTemplatesPage: React.FC = () => {
  const dietContext = useContext(DietContext);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Array<{ food_id: number; name: string; serving_size: number; protein: number; carbs?: number; fat?: number; calories: number; unit: string }>>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [foodSearchTerm, setFoodSearchTerm] = useState('');

  if (!dietContext) {
    return <div className="p-8 text-center">Loading context...</div>;
  }

  const { 
    mealTemplates, 
    createMealTemplate, 
    updateMealTemplate, 
    deleteMealTemplate, 
    getMealTemplate,
    dailyDiet 
  } = dietContext;

  // Initialize templates from context
  useEffect(() => {
    if (mealTemplates) {
      setTemplates(mealTemplates);
      setFilteredTemplates(mealTemplates);
      setLoading(false);
    }
  }, [mealTemplates]);

  // Filter templates based on search and category
  useEffect(() => {
    if (!templates.length) return;

    let result = [...templates];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(template => 
        template.name.toLowerCase().includes(lowerCaseSearch) || 
        (template.description?.toLowerCase().includes(lowerCaseSearch)) ||
        template.foods_json.some(food => food.name.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(template => {
        // Extract category from description if it contains a category tag like [Category: Breakfast]
        const categoryMatch = template.description?.match(/\[Category:\s*([^\]]+)\]/i);
        const templateCategory = categoryMatch ? categoryMatch[1].trim().toLowerCase() : '';
        return templateCategory === selectedCategory.toLowerCase();
      });
    }
    
    setFilteredTemplates(result);
  }, [searchTerm, selectedCategory, templates]);

  // Extract unique categories from templates
  const getCategories = () => {
    const categorySet = new Set<string>();
    
    templates.forEach(template => {
      const categoryMatch = template.description?.match(/\[Category:\s*([^\]]+)\]/i);
      if (categoryMatch) {
        categorySet.add(categoryMatch[1].trim());
      }
    });
    
    return Array.from(categorySet).sort();
  };

  // Handle viewing template details
  const handleViewTemplate = async (templateId: number) => {
    try {
      const template = await getMealTemplate(templateId);
      setSelectedTemplate(template);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching template details:', error);
    }
  };

  // Handle template edit
  const handleEditTemplate = async (templateId: number) => {
    try {
      const template = await getMealTemplate(templateId);
      
      setEditTemplateId(templateId);
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      
      // Extract category if present
      const categoryMatch = template.description?.match(/\[Category:\s*([^\]]+)\]/i);
      setTemplateCategory(categoryMatch ? categoryMatch[1].trim() : '');
      
      setSelectedFoods(template.foods_json);
      setIsEditMode(true);
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error('Error loading template for editing:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  // Handle template deletion
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

  // Open create template modal
  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Reset form fields
  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('');
    setSelectedFoods([]);
    setIsEditMode(false);
    setEditTemplateId(null);
    setFoodSearchTerm('');
  };

  // Handle template creation/update
  const handleSaveTemplate = async () => {
    if (templateName.trim() === '') {
      alert('Please enter a template name');
      return;
    }

    if (selectedFoods.length === 0) {
      alert('Please select at least one food');
      return;
    }

    try {
      // Add category to description if provided
      let finalDescription = templateDescription;
      if (templateCategory.trim()) {
        // Remove any existing category tag
        finalDescription = finalDescription.replace(/\[Category:\s*[^\]]+\]/i, '').trim();
        // Add new category tag
        finalDescription = `[Category: ${templateCategory}]\n${finalDescription}`.trim();
      }

      if (isEditMode && editTemplateId) {
        // Update existing template
        await updateMealTemplate(editTemplateId, {
          name: templateName,
          description: finalDescription,
          foods_json: selectedFoods
        });
      } else {
        // For create, we need to use the method from DietContext which requires a different format
        const foodsWithDetails = selectedFoods.map(food => ({
          id: food.food_id,
          name: food.name,
          protein: food.protein,
          carbs: food.carbs || 0, // Ensure carbs is always a number
          fat: food.fat || 0, // Ensure fat is always a number
          calories: food.calories,
          serving_size: food.serving_size,
          unit: food.unit
        }));
        
        await createMealTemplate(templateName, finalDescription, foodsWithDetails);
      }

      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  // Add food item to template
  const handleAddFood = (food: any) => {
    // Check if food is already in the selected foods
    if (selectedFoods.some(f => f.food_id === food.id)) {
      setSelectedFoods(selectedFoods.filter(f => f.food_id !== food.id));
    } else {
      const newFood = {
        food_id: food.id,
        name: food.name,
        serving_size: food.serving_size,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        calories: food.calories,
        unit: food.unit
      };
      setSelectedFoods([...selectedFoods, newFood]);
    }
  };

  // Calculate template nutrition totals
  const calculateTotals = (foods: any[]) => {
    return foods.reduce((acc, food) => {
      return {
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
        calories: acc.calories + (food.calories || 0)
      };
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });
  };

  return (
    <div className="container mx-auto sm:px-4 sm:py-6">
      <div className="bg-white rounded-lg sm:shadow-md sm:p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Meal Templates</h1>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={handleOpenCreateModal}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create Template
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No templates found</p>
            <p className="text-gray-400 mt-2">Create a new template or adjust your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              // Calculate nutrition totals
              const totals = calculateTotals(template.foods_json);
              
              // Extract category if present
              let category = '';
              const categoryMatch = template.description?.match(/\[Category:\s*([^\]]+)\]/i);
              if (categoryMatch) {
                category = categoryMatch[1].trim();
              }
              
              // Clean description by removing category tag
              let cleanDescription = template.description || '';
              if (categoryMatch) {
                cleanDescription = cleanDescription.replace(categoryMatch[0], '').trim();
              }

              return (
                <div 
                  key={template.id} 
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleEditTemplate(template.id!)}
                          aria-label={`Edit ${template.name}`}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteTemplate(template.id!)}
                          aria-label={`Delete ${template.name}`}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    
                    {category && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                        {category}
                      </span>
                    )}
                    
                    {cleanDescription && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cleanDescription}</p>
                    )}
                    
                    <div className="mb-4">
                      <div className="grid grid-cols-4 text-xs text-gray-500 mb-1">
                        <div>Calories</div>
                        <div>Protein</div>
                        <div>Carbs</div>
                        <div>Fat</div>
                      </div>
                      <div className="grid grid-cols-4 text-sm font-medium">
                        <div>{totals.calories.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                        <div>{totals.protein.toFixed(1)}g</div>
                        <div>{totals.carbs.toFixed(1)}g</div>
                        <div>{totals.fat.toFixed(1)}g</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {template.foods_json.length} food items
                    </div>
                    
                    <button
                      className="mt-4 bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded-md flex items-center justify-center"
                      onClick={() => handleViewTemplate(template.id!)}
                    >
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="E.g., Breakfast, Protein Shake, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={templateCategory}
                    onChange={e => setTemplateCategory(e.target.value)}
                    placeholder="E.g., Breakfast, Lunch, Dinner, Snack"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {getCategories().map(category => (
                      <option key={category} value={category} />
                    ))}
                    {!getCategories().includes('Breakfast') && <option value="Breakfast" />}
                    {!getCategories().includes('Lunch') && <option value="Lunch" />}
                    {!getCategories().includes('Dinner') && <option value="Dinner" />}
                    {!getCategories().includes('Snack') && <option value="Snack" />}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={templateDescription}
                    onChange={e => setTemplateDescription(e.target.value)}
                    placeholder="Add a description for this meal template"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800">Select Foods</h3>
                  {selectedFoods.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedFoods.length} items selected
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search foods..."
                    value={foodSearchTerm}
                    onChange={(e) => setFoodSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                  {dailyDiet.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No foods available to select.</p>
                      <p className="text-sm">Try adding some foods to your diary first.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {dailyDiet
                        .filter(food => 
                          foodSearchTerm === '' || 
                          food.name.toLowerCase().includes(foodSearchTerm.toLowerCase())
                        )
                        .map(food => (
                          <div 
                            key={food.id}
                            className={`p-3 flex items-center hover:bg-gray-50 ${
                              selectedFoods.some(f => f.food_id === food.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                              checked={selectedFoods.some(f => f.food_id === food.id)}
                              onChange={() => handleAddFood(food)}
                            />
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-xs text-gray-500">
                                {food.calories} cal | P: {food.protein}g | C: {food.carbs || 0}g | F: {food.fat || 0}g
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedFoods.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Selected Foods</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="max-h-40 overflow-y-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Protein</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Carbs</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fat</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedFoods.map((food, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{food.name}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{food.protein}g</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{food.carbs || 0}g</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{food.fat || 0}g</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{food.calories}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <button 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => setSelectedFoods(selectedFoods.filter((_, i) => i !== index))}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Totals */}
                    {selectedFoods.length > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <div className="grid grid-cols-5 text-sm">
                          <div className="font-semibold">Totals:</div>
                          <div className="text-center">{calculateTotals(selectedFoods).protein.toFixed(1)}g</div>
                          <div className="text-center">{calculateTotals(selectedFoods).carbs.toFixed(1)}g</div>
                          <div className="text-center">{calculateTotals(selectedFoods).fat.toFixed(1)}g</div>
                          <div className="text-center">{calculateTotals(selectedFoods).calories.toFixed(0)} cal</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleSaveTemplate}
                  disabled={templateName.trim() === '' || selectedFoods.length === 0}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {isEditMode ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {isViewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedTemplate.name}</h2>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>
              
              {/* Extract category */}
              {selectedTemplate.description && (() => {
                const categoryMatch = selectedTemplate.description.match(/\[Category:\s*([^\]]+)\]/i);
                if (categoryMatch) {
                  return (
                    <div className="mb-4">
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {categoryMatch[1].trim()}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Clean description by removing category tag */}
              {selectedTemplate.description && (() => {
                let cleanDescription = selectedTemplate.description;
                const categoryMatch = cleanDescription.match(/\[Category:\s*[^\]]+\]/i);
                if (categoryMatch) {
                  cleanDescription = cleanDescription.replace(categoryMatch[0], '').trim();
                }
                if (cleanDescription) {
                  return (
                    <div className="mb-6">
                      <p className="text-gray-600">{cleanDescription}</p>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Nutrition summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Nutrition Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const totals = calculateTotals(selectedTemplate.foods_json);
                    return (
                      <>
                        <div className="bg-white p-3 rounded-md shadow-sm text-center">
                          <div className="text-gray-500 text-sm">Calories</div>
                          <div className="text-2xl font-bold text-gray-800">{totals.calories.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm text-center">
                          <div className="text-gray-500 text-sm">Protein</div>
                          <div className="text-2xl font-bold text-gray-800">{totals.protein.toFixed(1)}g</div>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm text-center">
                          <div className="text-gray-500 text-sm">Carbs</div>
                          <div className="text-2xl font-bold text-gray-800">{totals.carbs.toFixed(1)}g</div>
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm text-center">
                          <div className="text-gray-500 text-sm">Fat</div>
                          <div className="text-2xl font-bold text-gray-800">{totals.fat.toFixed(1)}g</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Foods list */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Foods ({selectedTemplate.foods_json.length})</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Food</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Protein</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Carbs</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Fat</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Calories</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedTemplate.foods_json.map((food, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{food.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">{food.protein}g</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">{food.carbs || 0}g</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">{food.fat || 0}g</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">{food.calories}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => {
                    if (!selectedTemplate?.id) return;
                    setIsViewModalOpen(false);
                    handleEditTemplate(selectedTemplate.id);
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  Edit Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealTemplatesPage; 