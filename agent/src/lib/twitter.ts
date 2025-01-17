import { elizaLogger } from "@elizaos/core";
import { Scraper } from "agent-twitter-client";

import { APPLE_DOG_DESCRIPTION, QUALIFIERS } from "./constants.ts";

import { getIntent, extractContent } from "./text.ts";
import { generateVideo } from "./minimax.ts";

interface TwitterResponseProps {
    state: any;
    message: any;
    runtime: any;
    apiKey: string;
}

interface TwitterResponseResult {
    result: any;
}

export function hasAnyQualifier(text: string) {
    return QUALIFIERS.some((qualifier) =>
        text.toLowerCase().includes(qualifier)
    );
}

export function hasMyWithQualifier(text: string) {
    const qualifierPattern = QUALIFIERS.join("|");
    const regex = new RegExp(`\\bmy\\b.*\\b(${qualifierPattern})\\b`, "i");
    return regex.test(text);
}

export const getUsername = (text: string): string | null => {
    const match = text.match(/@(\w+)/);
    return match ? match[1] : null; // Extract the username (without @) or return null
};

export const getId = (text: string) => {
    const match = text.match(/ID:\s*(\d+)/);
    return match?.[1] || null; // Return the extracted ID or null
};

export const fetchProfileAvatar = async (username: string, scraper) => {
    elizaLogger.log(`Fetching profile for username: ${username}`);

    const profile = await scraper.getProfile(username);

    if (profile?.avatar) {
        elizaLogger.log(`Found profile avatar for ${username}`);
        return profile.avatar;
    }

    elizaLogger.log(`No avatar found for ${username}`);

    return null;
};

export const twitterResponse = async ({
                                          state,
                                          message,
                                          runtime,
                                          apiKey,
                                      }: TwitterResponseProps): Promise<TwitterResponseResult> => {
    try {
        const defaultBaseImage = runtime.getSetting("APPLE_DOG_IMAGE");

        const twitterClient = runtime.clients.twitter?.client?.twitterClient;
        const scraper = twitterClient || new Scraper();
        elizaLogger.log("Twitter client initialized");

        let tweet;
        try {
            const tweetId = getId(state.currentPost as string);
            tweet = await twitterClient.getTweet(tweetId);
            elizaLogger.log("Tweet fetched successfully");
        } catch (tweetError) {
            elizaLogger.error("Error fetching tweet:", tweetError);
            throw new Error(`Failed to fetch tweet: ${tweetError.message}`);
        }

        // Extract command text early
        const userPrompt = message.content.text;
        const content = extractContent(userPrompt);
        elizaLogger.log("Extracted content:", content);

        const hasAttachments = tweet.photos?.length > 0;
        let baseImage = defaultBaseImage;
        let profileUsername = null;

        try {
            // Priority order:
            // 1. Check for "my" qualifier first (user's own profile)
            if (hasMyWithQualifier(content)) {
                profileUsername = tweet.username;
                baseImage = await fetchProfileAvatar(profileUsername, scraper);
                elizaLogger.log(
                    `Using user's profile image for ${profileUsername}`
                );
            }

            // 2. If no "my" qualifier, check for image attachment
            else if (hasAnyQualifier(content)) {
                profileUsername = getUsername(content);
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
        } catch (imageError) {
            elizaLogger.error("Error fetching profile/image:", imageError);
            elizaLogger.log("Falling back to default base image");
            baseImage = defaultBaseImage;
        }

        // 4. Default to apple dog image (already set in baseImage)
        elizaLogger.log(`Final base image source: ${baseImage}`);

        // Construct prompt with appropriate context
        const shouldAddDescription = hasAttachments || profileUsername;

        try {
            const intent = getIntent(content);
            elizaLogger.log("Extracted intent:", intent);

            const prompt = `${content} ${shouldAddDescription ? APPLE_DOG_DESCRIPTION : ""}`;
            elizaLogger.log(`Generated prompt: ${prompt}`);

            const { result } = await generateVideo({
                apiKey,
                prompt,
                baseImage,
                userId: message.userId,
            });

            elizaLogger.log("Video generation completed successfully");

            return { result };
        } catch (videoError) {
            elizaLogger.error("Error generating video:", videoError);
            throw new Error(`Video generation failed: ${videoError.message}`);
        }
    } catch (error) {
        elizaLogger.error("Fatal error in twitterResponse:", error);
        return {
            result: null,
        };
    }
};
