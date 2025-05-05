import {config} from "dotenv";
import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
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

export const validationPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a Prompt Validator Agent for building Form.io forms used in the Valtimo/GZAC platform.

        Your job is to:
        - Evaluate if a natural language prompt is suitable for generating a structured Form.io form
        - Return a structured JSON response that indicates if it's valid and create blueprint of the request to prompt to the build agent
        
        Evaluation rules:
        
        1. The prompt must clearly define the purpose of the form (e.g., "permit request", "job application").
        2. It must include at least two fields, ideally with:
           - Field names
           - Field types (e.g., text, number, date, email)
           - Whether each field is required or optional
        3. If conditional logic or validation rules are mentioned, include them.
        4. Do not accept vague or incomplete prompts. Phrases like "etc." or "some fields" are not allowed.
        5. Output must be in the language specified.
        
        Respond with this JSON structure:

{{
  "valid": true,
  "reason": "Why the prompt is valid",
  "blueprint": {{
    "title": "Short form title",
    "description": "Short purpose of the form",
    "fields": [
      {{
        "key": "camelCaseFieldKey",
        "label": "Field label",
        "type": "textfield",
        "required": true
      }}
    ],
    "logic": [
      {{
        "type": "conditional",
        "show": "email",
        "when": "subscribe",
        "eq": "yes"
      }}
    ]
  }}
}}

Or if invalid:

{{
  "valid": false,
  "reason": "Why it was rejected",
  "blueprint": "when valid is false leave this field empty"
}}

Output only JSON. No text or explanation.
`,
    ],
    ["human", "Language: {lang}, Prompt:{userPrompt}"],
]);

export const PromptValidatorAgent = RunnableSequence.from([
    validationPrompt,
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
