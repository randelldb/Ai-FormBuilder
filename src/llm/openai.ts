import {config} from 'dotenv';
import {ChatOpenAI} from "@langchain/openai";

config();

export const chatLLM = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0.3,
});

