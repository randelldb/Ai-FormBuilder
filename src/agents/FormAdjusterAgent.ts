import {PromptTemplate} from "@langchain/core/prompts";
import {config} from "dotenv";
import {ChatOpenAI} from "@langchain/openai";
import {RunnableSequence} from "@langchain/core/runnables";

config();

export const chatLLM = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0.3,
    streaming: true,
    callbacks: [
        {
            handleLLMNewToken(token: string) {
                process.stdout.write(token);
            },
        },
    ],
});


const adjustPrompt = new PromptTemplate({
    inputVariables: ["existingSchema", "adjustmentPrompt"],
    template: `
        You are a Form.io Form Adjuster Agent.
        
        Your job is to apply only the requested changes to an existing Form.io JSON schema.
        
        ---
        
        🎯 Adjustment Instructions (from user):
        {adjustmentPrompt}
        
        📄 Original Form.io Schema:
        {existingSchema}
        
        ---
        
        ⚠️ Strict Rules:
        - Make only the requested adjustments — do not change anything else.
        - Keep all original fields, logic, and structure unless explicitly mentioned.
        - Maintain camelCase for keys and valid Form.io structure.
        - Output must be valid Form.io JSON — no extra text.
        
        ---
        
        Return only the modified JSON schema.
        `,
});

export const FormAdjusterAgent = RunnableSequence.from([
    adjustPrompt,
    chatLLM,
    async (response) => {
        try {
            const content = response?.content;
            return JSON.parse(content ?? "{}");
        } catch (err) {
            throw new Error("Failed to parse JSON from validator response.");
        }
    },
]);

