
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
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "As a nutritionist, provide protein and calorie content of foods.",
                },
                {
                    role: "user",
                    content: `${aiInputText}: {food_name, protein (g, float), calories, measurement (weight/volume)} as JSON.`,
                },
            ],
            temperature: 1,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(response.choices[0].message.content),
        };
    } catch (error) {
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
