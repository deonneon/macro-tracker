import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const corsOptions = {
    origin: ['http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// OpenAI endpoint
app.post('/api/query-openai', async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const { aiInputText } = req.body;

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
        console.log(response.choices[0].message.content);
        // Parse the JSON string into an object
        const parsed = JSON.parse(response.choices[0].message.content);
       
        res.json(parsed); // Send the parsed object
    } catch (error) {
        console.error("Error with OpenAI:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Fallback route for API health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', migratedToSupabase: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 