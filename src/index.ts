import inquirer from "inquirer";
import {formCreationFlow} from "./chains/FormCreationChain";
import fs from "fs";
import {FormAdjusterAgent} from "./agents/FormAdjusterAgent";

async function main() {
    console.clear();
    console.log("🛠️  FormBuilder CLI");

    const {userPrompt} = await inquirer.prompt([
        {
            type: "input",
            name: "userPrompt",
            message: "Describe the form you want to create:",
        },
    ]);

    const result = await formCreationFlow({userPrompt, lang: "nl"});

    if (result.status === "rejected") {
        console.log(`\nPrompt was rejected:\n${result.validation.reason}`);
        return;
    }

    console.log("\nPrompt validated!");
    console.log("Summary:");
    console.log(JSON.stringify(result.validation.blueprint, null, 2));

    console.log("\nGenerated Form.io schema:");
    console.log(JSON.stringify(result.schema, null, 2));

    const {wantsAdjustment} = await inquirer.prompt([
        {
            type: "confirm",
            name: "wantsAdjustment",
            message: "Would you like to make adjustments?",
            default: false,
        },
    ]);

    if (wantsAdjustment) {
        const {adjustmentPrompt} = await inquirer.prompt([
            {
                type: "input",
                name: "adjustmentPrompt",
                message: "✏️ What should be changed?",
            },
        ]);

        const adjustResult = await FormAdjusterAgent.invoke({
            existingSchema: JSON.stringify(result.schema),
            adjustmentPrompt,
        });

        console.log("\nAdjusted schema:");
        console.log(JSON.stringify(adjustResult.adjustedSchema, null, 2));
    }

    const {wantsSave} = await inquirer.prompt([
        {
            type: "confirm",
            name: "wantsSave",
            message: "Save final schema to a JSON file?",
            default: false,
        },
    ]);

    if (wantsSave) {
        const filename = `formio-schema-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(result.schema, null, 2));
        console.log(`Saved to ./${filename}`);
    }
}

main().catch((err) => {
    console.error("Unexpected error:", err);
});
