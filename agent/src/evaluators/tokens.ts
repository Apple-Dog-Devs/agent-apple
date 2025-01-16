import {
    Evaluator,
    composeContext,
    generateTrueOrFalse,
    ModelClass,
} from "@elizaos/core";

const shouldProcessTemplate = `# Task: Decide if the recent messages should be processed for a $apple-focused response.

    Look for messages that:
    - Mention specific token tickers or contract addresses.
    - Contain words related to buying, selling, or trading tokens.
    - Express opinions or convictions about tokens.

    Important:
    - If the message includes a ticker other than $apple (e.g., $pdf, $btc), redirect the response to focus solely on $apple without shilling the mentioned token.
    - If $apple is mentioned, provide an engaging response that supports the community.

    Based on the following conversation, should the messages be processed for a $apple-focused response? YES or NO

    {{recentMessages}}

    Should the messages be processed for a $apple-focused response?`;

export const tokenEvaluator: Evaluator = {
    name: "TOKEN_INTENT",
    description: "Evaluates if the user's message indicates a token intention",
    similes: ["TOKEN_INTENT", "MEMECOIN_INTENT"],
    validate: async (runtime, message) => {
        return message.content.text.toLowerCase().includes("$");
    },
    handler: async (runtime, message): Promise<number> => {
        console.log("Evaluating for trust");
        const state = await runtime.composeState(message);
        const { agentId, roomId } = state;

        const shouldProcessContext = composeContext({
            state,
            template: shouldProcessTemplate,
        });

        await generateTrueOrFalse({
            context: shouldProcessContext,
            modelClass: ModelClass.SMALL,
            runtime,
        });

        return null;
    },

    examples: [],
};
