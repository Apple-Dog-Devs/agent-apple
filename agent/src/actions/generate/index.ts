import {
    type Action,
    ActionExample,
    composeContext,
    Content,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    generateText,
    trimTokens,
} from "@elizaos/core";
import {
    QueryTweetsResponse,
    Scraper,
    SearchMode,
    Tweet,
} from "agent-twitter-client";

import { KEYWORDS, APPLE_DOG_DESCRIPTION } from "../../lib/constants.ts";
import { TEMPLATES } from "../../lib/templates.ts";
import { extractContent } from "../../lib/text.ts";

import { initiateGeneration } from "../../lib/minimax.ts";
import { watchGenerationStatus } from "../../lib/threadedWatcher.ts";
import { toBase64 } from "../../lib/base64.ts";

const calculateRemainingTime = (time: number) => {
    const diff = Math.abs(new Date(time).getTime() - new Date().getTime());
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor(diff / 1000 / 60) - hours * 60;

    return { minutes };
};

export const generateVideo: Action = {
    //suppressInitialMessage: true,
    name: "GENERATE_VIDEO",
    similes: [
        "MAKE_VIDEO",
        "CREATE_VIDEO",
        "PRODUCE_VIDEO",
        "GENERATE_APPLEDOG_VIDEO",
        "MAKE_APPLEDOG_VIDEO",
        "GENERATE_APPLE_DOG_VIDEO",
        "MAKE_APPLE_DOG_VIDEO",
    ],
    description:
        "create custom videos featuring the “Apple Dog” character based on user-provided prompts",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();

        const containsKeyword = KEYWORDS.some((keyword) =>
            text.includes(keyword)
        );

        return containsKeyword;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        const scraper = new Scraper();

        elizaLogger.log("Starting GENERATE_VIDEO...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const profile = await scraper.getProfile("Raleigh_CA");

        console.log(profile);

        return;

        console.log("================================ message ", message);

        const defaultBaseImage = runtime.getSetting("APPLE_DOG_IMAGE");
        const apiKey = runtime.getSetting("MINIMAXI_API_KEY");

        const hasAttachments = message.content.attachments?.length > 0;
        const attachmentBaseImage =
            hasAttachments && message.content.attachments[0]?.url;

        const baseImage = attachmentBaseImage || defaultBaseImage;

        try {
            const base64Image = await toBase64(baseImage);

            const initResult = await initiateGeneration({
                key: apiKey,
                prompt: `${message.content.text} ${hasAttachments && APPLE_DOG_DESCRIPTION}`,
                base: base64Image,
            });

            console.log(
                "========================================== init result: ",
                initResult
            );

            if (!initResult.taskId) {
                throw new Error(
                    initResult.error || "Failed to start generation"
                );
            }

            console.log(
                "========================================== watch generation: ",
                initResult
            );
            const result = await watchGenerationStatus({
                key: apiKey,
                taskId: initResult.taskId,
                userId: message.userId,
            });

            const userPrompt = message.content.text;
            const getIntent = extractContent(userPrompt);

            const context = composeContext({
                state,
                template: TEMPLATES.generationSuccess(getIntent),
            });

            const llmResponse = await generateText({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            console.log(
                "========================================== callback: ",
                result
            );

            if (callback) {
                callback({
                    text: llmResponse,
                    action: "GENERATE_VIDEO",
                    inReplyTo: message.content.inReplyTo,
                    attachments: [
                        {
                            id: result.fileId,
                            url: result.downloadUrl,
                            title: "appledog.mp4",
                            source: result.downloadUrl,
                            description: message.content.text,
                            text: "Here's your video",
                            contentType: "video/mp4",
                        },
                    ],
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error(
                `Error in generate video handler: ${error.message}`
            );

            if (callback) {
                callback({
                    text: "Hmmm something went wrong. Please try again later.",
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "generate a video of a apple dog swimming in a pool",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "generating a video of a apple dog swimming in a pool",
                    action: "GENERATE_VIDEO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "here's your video of apple dog swimming in a pool. $apple",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "dog with apple swings in nyc with spiderman",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "generating a video of a dog with apple swinging in nyc with spiderman",
                    action: "GENERATE_VIDEO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "here's your video of dog with apple swinging in nyc with spiderman! $apple",
                },
            },
        ],
    ] as ActionExample[][],
};
