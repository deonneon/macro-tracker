
const IngredientList = () => {
    const ingredients = [
        'Chicken breast', 'Salmon', 'Tuna', 'Ground beef', 'Turkey',
        'Tofu', 'Quinoa', 'Brown rice', 'White rice', 'Oats',
        'Almonds', 'Eggs', 'Broccoli', 'Spinach', 'Kale',
        'Sweet potato', 'White potato', 'Olive oil', 'Coconut oil', 'Avocado',
        'Bananas', 'Apples', 'Strawberries', 'Blueberries', 'Greek yogurt',
        'Low-fat milk', 'Skim milk', 'Whole milk', 'Cottage cheese', 'Cheddar cheese',
        'Lentils', 'Chickpeas', 'Kidney beans', 'Black beans', 'Tomatoes',
        'Onions', 'Garlic', 'Carrots', 'Green beans', 'Peas',
        'Bell peppers', 'Beef steak', 'Pork chop', 'Shrimp', 'Cod',
        'Ground turkey', 'Bacon', 'Peanut butter', 'Almond butter', 'Whey protein powder',
        'Soy protein powder', 'Pasta', 'Bread', 'Butter', 'Cream',
        'Honey', 'Maple syrup', 'Dark chocolate', 'Ground chicken', 'Zucchini',
        'Cucumber', 'Brussel sprouts', 'Cauliflower', 'Mushrooms', 'Eggplant',
        'Cashews', 'Walnuts', 'Chia seeds', 'Flaxseeds', 'Pumpkin seeds',
        'Sunflower seeds', 'Pineapple', 'Oranges', 'Grapes', 'Mangos',
        'Raspberries', 'Kiwi', 'Pomegranate', 'Lettuce', 'Cabbage',
        'Corn', 'Wheat flour', 'Almond flour', 'Coconut flour', 'Sugar',
        'Soy sauce', 'Mustard', 'Ketchup', 'Vinegar', 'Ground oat flour',
        'Sausage', 'Ham', 'Turkey breast', 'Roast beef', 'Tuna steak',
        'Tilapia', 'Sardines', 'Mackerel', 'Trout', 'Flank steak'
    ];

    return (
        <div>
            <h2>Popular Food Ingredients:</h2>
            <ul>
                {ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                ))}
            </ul>
        </div>
    );
}

export default IngredientList;
    