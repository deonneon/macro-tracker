const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { aiInputText } = JSON.parse(event.body);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "As a nutritionist, provide protein, calorie, carb, fat, and measurement content of foods. Return only a JSON object with the following schema: { food_name: string, protein: float, calories: float, carb: float, fat: float, measurementSize: float, measurementUnit: string }. All values must be floats. Do not include any explanation or extra text.",
                },
                {
                    role: "user",
                    content: `${aiInputText}`,
                },
            ],
            response_format: { type: "json_object" },
        });
        // Parse the JSON string into an object
        const parsed = JSON.parse(response.choices[0].message.content);
        return {
            statusCode: 200,
            body: JSON.stringify(parsed),
        };
    } catch (error) {
        console.error("Error with OpenAI:", error);
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
