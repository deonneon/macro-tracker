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
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
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
            model: "gpt-4",
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

        res.json(response.choices[0].message.content);
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