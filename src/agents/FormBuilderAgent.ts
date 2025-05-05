import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {RunnableSequence} from "@langchain/core/runnables";

const chatLLM = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY,
    callbacks: [
        {
            handleLLMNewToken(token: string) {
                process.stdout.write(token);
            },
        },
    ],
});

export const formBuilderAgent = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a FormBuilder agent.

        Your job is to generate a valid Form.io JSON schema for a form that will be used inside the Valtimo/GZAC platform.
        
        ---
        
        Language:
        - All labels, descriptions, and messages must be in: {lang}
        
        General rules:
        - Use only valid Form.io component types:
          textfield, textarea, email, phoneNumber, number, checkbox, date, select, radio, file
        - Use camelCase for all field keys
        - All fields must be inside a single components array
        - Output must be valid JSON — no extra text, no comments
        - Do not invent fields or logic that were not explicitly requested
        
        ---
        
        Form Logic & Calculations:
        
        If the form includes dynamic behavior, use one of these official Form.io methods:
        
        1. Simple Logic (show/hide based on a field value)
        "conditional": {{
          "show": true,
          "when": "subscribe",
          "eq": "yes"
        }}
        
        2. Advanced Logic (for complex conditions, using logic array)
        "logic": [
          {{
            "name": "showIfAdmin",
            "trigger": {{
              "type": "simple",
              "simple": {{
                "show": true,
                "when": "userRole",
                "eq": "admin"
              }}
            }},
            "actions": [
              {{
                "name": "Show field",
                "type": "property",
                "property": {{
                  "label": "visible",
                  "value": true
                }}
              }}
            ]
          }}
        ]
        
        3. Calculated Value (use JavaScript to auto-fill a field)
        "calculateValue": "value = data.firstName + ' ' + data.lastName;"
        
        Only embed logic if explicitly requested. Never describe logic in words.
        
        ---
        
        Return only the raw Form.io JSON.
        `,
    ],
    [
        "human", `Form build blueprint to build from: {validationOutput}`,
    ],
]);

export const FormBuilderAgent = RunnableSequence.from([
    formBuilderAgent,
    chatLLM,
    async (response) => {
        try {
            const content = response?.content;
            return JSON.parse(content ?? "{}");
        } catch (err) {
            throw new Error("Failed to parse JSON from builder agent.");
        }
    },
]);
