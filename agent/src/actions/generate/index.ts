import {
    type Action,
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
import { Scraper } from "agent-twitter-client";

import { KEYWORDS, APPLE_DOG_DESCRIPTION } from "../../lib/constants.ts";
import { TEMPLATES } from "../../lib/templates.ts";
import { extractContent } from "../../lib/text.ts";
import {
    hasAnyQualifier,
    getUsername,
    hasMyWithQualifier,
    getId,
    fetchProfileAvatar,
} from "../../lib/twitter.ts";

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
        const twitterClient = runtime.clients.twitter?.client?.twitterClient;
        const scraper = twitterClient || new Scraper();

        elizaLogger.log("Starting GENERATE_VIDEO...");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        try {
            // Inside the try block of your handler
            const apiKey = runtime.getSetting("MINIMAXI_API_KEY");
            const defaultBaseImage = runtime.getSetting("APPLE_DOG_IMAGE");

            const tweetId = getId(state.currentPost as string);
            const tweet = await twitterClient.getTweet(tweetId);
            const hasAttachments = tweet.photos?.length > 0;

            // Determine base image source with clear priority
            let baseImage = defaultBaseImage;
            let profileUsername = null;

            // Priority order:
            // 1. Check for "my" qualifier first (user's own profile)
            if (hasMyWithQualifier(message.content.text)) {
                profileUsername = tweet.username;
                baseImage = await fetchProfileAvatar(profileUsername, scraper);
                elizaLogger.log(
                    `Using user's profile image for ${profileUsername}`
                );
            }

            // 2. If no "my" qualifier, check for image attachment
            else if (hasAnyQualifier(message.content.text)) {
                const username = getUsername(message.content.text);
                profileUsername = username;
                baseImage = await fetchProfileAvatar(profileUsername, scraper);
                elizaLogger.log(
                    `Using specified profile image for ${profileUsername}`
                );
            }

            // 3. If no attachment, check for other qualifiers (@username)
            else if (hasAttachments) {
                baseImage = tweet.photos[0].url;
                elizaLogger.log("Using tweet attachment image");
            }

            // 4. Default to apple dog image (already set in baseImage)
            elizaLogger.log(`Final base image source: ${baseImage}`);

            const base64Image = await toBase64(baseImage);

            // Construct prompt with appropriate context
            const shouldAddDescription = hasAttachments || profileUsername;

            // Generate response text
            const userPrompt = message.content.text;
            const getIntent = extractContent(userPrompt);

            console.log(
                "============================================ INTENT TEST"
            );
            console.log(getIntent);
            console.log(
                "============================================ INTENT TEST"
            );

            const prompt = `${getIntent} ${shouldAddDescription ? APPLE_DOG_DESCRIPTION : ""}`;
            elizaLogger.log(`Generated prompt: ${prompt}`);

            // Initiate generation
            const initResult = await initiateGeneration({
                key: apiKey,
                prompt,
                base: base64Image,
            });

            if (!initResult.taskId) {
                throw new Error(
                    initResult.error || "Failed to start generation"
                );
            }

            elizaLogger.log(
                `Generation initiated with taskId: ${initResult.taskId}`
            );

            // Watch the generation status
            const result = await watchGenerationStatus({
                key: apiKey,
                taskId: initResult.taskId,
                userId: message.userId,
            });

            const context = composeContext({
                state,
                template: TEMPLATES.generationSuccess,
            });

            const llmResponse = await generateText({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

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
