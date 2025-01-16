import { elizaLogger } from "@elizaos/core";

import { extractContent } from "./text.ts";
import { generateVideo } from "./minimax.ts";

interface TelegramResponseProps {
    message: any;
    runtime: any;
    apiKey: string;
}

interface TelegramResponseResult {
    result: any;
}

export const telegramResponse = async ({
                                           message,
                                           runtime,
                                           apiKey,
                                       }: TelegramResponseProps): Promise<TelegramResponseResult> => {
    const defaultBaseImage = runtime.getSetting("APPLE_DOG_IMAGE");

    elizaLogger.log(`Final base image source: ${defaultBaseImage}`);

    const userPrompt = message.content.text;
    const getIntent = extractContent(userPrompt);

    elizaLogger.log(`Generated prompt: ${userPrompt}`);

    const { result } = await generateVideo({
        apiKey,
        prompt: getIntent,
        baseImage: defaultBaseImage,
        userId: message.userId,
    });

    return {
        result,
    };
};
