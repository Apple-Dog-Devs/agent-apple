import {
    type Action,
    type Content,
    ActionExample,
    composeContext,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    generateText,
} from "@elizaos/core";

import { KEYWORDS, TEMPLATES } from "../lib/constants.ts";

import { twitterResponse } from "../lib/twitter.ts";
import { cleanupAllTempFiles } from "../lib/cleanup.ts";

export const generateVideo: Action = {
    suppressInitialMessage: true,
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

        return KEYWORDS.some((keyword) =>
            text.includes(keyword)
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting GENERATE_VIDEO...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const apiKey = runtime.getSetting("MINIMAXI_API_KEY");

        try {
            const { result } = await twitterResponse({
                state,
                message,
                runtime,
                apiKey,
            });

            const context = composeContext({
                state,
                template: TEMPLATES.generationSuccess(message.content.text),
            });

            const llmResponse = await generateText({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (callback) {
                const callbackData: Content = {
                    text: llmResponse,
                    action: "GENERATE_VIDEO",
                    inReplyTo: message.content.inReplyTo,
                };

                if (result) {
                    callbackData.attachments = [
                        {
                            id: result.fileId,
                            url: result.downloadUrl,
                            title: "appledog.mp4",
                            source: result.downloadUrl,
                            description: message.content.text,
                            text: "Here's your video",
                            contentType: "video/mp4",
                        },
                    ];
                }

                callback(callbackData);
            }

            await cleanupAllTempFiles();

            return true;
        } catch (error) {
            elizaLogger.error(
                `Error in generate video handler: ${error.message}`
            );

            const context = composeContext({
                state,
                template: TEMPLATES.generationError,
            });

            const llmResponse = await generateText({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (callback) {
                callback({
                    text: llmResponse,
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
                    text: "create a video with @solgavo profile picture.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "generating a video of @solgavo's profile picture.",
                    action: "GENERATE_VIDEO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "here's your video of apple dog with @solgavo",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "generate a video of apple dog and the incredible hulk",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "generating a video of apple dog and the incredible hulk",
                    action: "GENERATE_VIDEO",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "something went wrong generating a video of apple dog and the incredible hulk",
                },
            },
        ],
    ] as ActionExample[][],
};
