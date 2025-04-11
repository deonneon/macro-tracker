import React from 'react';

interface QAItem {
    question: string;
    answer: string;
}

const QAPage: React.FC = () => {
    const qaList: QAItem[] = [
        {
            question: "How do I track macros for my food?",
            answer: "You can start by inputting the food item in the Food Input section. Once entered, the macros will automatically be added to your daily log."
        },
        {
            question: "How accurate is the macro information?",
            answer: "While we strive to be accurate, it's always a good idea to cross-reference with other sources or labels if you're unsure."
        },
        {
            question: "Do organic and regular food have different food macros?",
            answer: "In general, the macronutrient profile (i.e., the proportions of carbohydrates, proteins, and fats) of an organic food is very similar to its conventional counterpart. For instance, an organic apple will have roughly the same amount of carbohydrates, proteins, and fats as a conventionally-grown apple."
        },
        {
            question: "Can I track multiple food items at once?",
            answer: "Yes, you can add multiple food items consecutively. Each entry will be separately logged in your daily log."
        },
        {
            question: "How do I edit a mistakenly entered macro?",
            answer: "Go to your daily log, find the food item you want to correct, and click on the edit icon next to it. Update the details and save the changes."
        },
        {
            question: "Can I track my macros for past days?",
            answer: "Certainly! You can select the desired date and input the macros for that specific day."
        },
        {
            question: "How do I set my daily macro goals?",
            answer: "Under settings, you'll find an option to set your daily macro goals. Input the desired protein and calorie count, and it will reflect in your daily tracking."
        },
        {
            question: "What if the food I'm eating doesn't have a label?",
            answer: "You can estimate its macros using online databases or macro tracking apps. While it may not be 100% accurate, it'll give you a good ballpark figure."
        },
        {
            question: "Can I track my water intake along with food macros?",
            answer: "Currently, this feature focuses on tracking protein and calorie intake. However, tracking water intake is a good feature suggestion for future updates!"
        },
        {
            question: "Does the tracker account for the cooking method of the food?",
            answer: "No, it primarily tracks raw or pre-cooked food macros. Cooking methods can alter macro values, so always consider that when inputting your details."
        },
        {
            question: "How do I delete a food item from my log?",
            answer: "Navigate to your daily log, find the food item you want to remove, and click on the delete icon next to it."
        },
        {
            question: "Are there plans to add micronutrient tracking?",
            answer: "Currently, the focus is on macronutrients. However, tracking micronutrients is a valuable suggestion that we might consider for future updates."
        },
        {
            question: "Why is tracking my macros important?",
            answer: "Tracking macros helps ensure a balanced diet and can assist in achieving specific fitness or health goals. It provides a clearer understanding of your nutrient intake and helps pinpoint areas for improvement."
        }
    ];

    return (
        <div className="flex justify-between h-screen px-[50px] py-[15px] box-border">
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-4">Common Questions</h2>
                <ul className="space-y-4">
                    {qaList.map((qa, index) => (
                        <li key={index} className="border-b border-gray-200 pb-4">
                            <p className="mb-2"><strong className="font-semibold">Q:</strong> {qa.question}</p>
                            <p><strong className="font-semibold">A:</strong> {qa.answer}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default QAPage; 