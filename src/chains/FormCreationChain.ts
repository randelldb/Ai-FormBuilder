import {PromptValidatorAgent} from "../agents/PromptValidatorAgent";
import {FormBuilderAgent} from "../agents/FormBuilderAgent";

type FormCreationInput = {
    userPrompt: string;
    lang?: string;
};

type FormCreationResult =
    | {
    status: "success";
    validation: {
        blueprint: string;
        reason: string;
    };
    schema: any;
}
    | {
    status: "rejected";
    validation: {
        reason: string;
        blueprint: string;
    };
};

export async function formCreationFlow({
                                           userPrompt,
                                           lang = "nl",
                                       }: FormCreationInput): Promise<FormCreationResult> {
    const validationRaw = await PromptValidatorAgent.invoke({userPrompt, lang});

    const builderResult = await FormBuilderAgent.invoke({
        validationOutput: validationRaw.blueprint,
        lang,
    });

    if (typeof validationRaw !== "object" || !("valid" in validationRaw)) {
        throw new Error("Validator output is invalid or malformed.");
    }

    if (!validationRaw.valid) {
        return {
            status: "rejected",
            validation: {
                reason: validationRaw.reason,
                blueprint: validationRaw.blueprint,
            },
        };
    }

    return {
        status: "success",
        validation: {
            reason: validationRaw.reason,
            blueprint: validationRaw.blueprint,
        },
        schema: builderResult,
    };
}
