import { elizaLogger } from "@elizaos/core";
import { Scraper } from "agent-twitter-client";

import { APPLE_DOG_DESCRIPTION } from "./constants.ts";

import { extractContent } from "./text.ts";
import { generateVideo } from "./minimax.ts";

const QUALIFIERS = ["profile", "profile picture", "pfp"];

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

export const getUsername = (text: string) => {
    if (hasAnyQualifier(text)) {
        const qualifierPattern = QUALIFIERS.join("|");
        const match = text.match(
            new RegExp(`with\\s+@(\\w+)\\s+(${qualifierPattern})`, "i")
        );
        return match?.[1] || null;
    }
    return null;
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
    const defaultBaseImage = runtime.getSetting("APPLE_DOG_IMAGE");

    const twitterClient = runtime.clients.twitter?.client?.twitterClient;
    const scraper = twitterClient || new Scraper();

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
        elizaLogger.log(`Using user's profile image for ${profileUsername}`);
    }

    // 2. If no "my" qualifier, check for image attachment
    else if (hasAnyQualifier(message.content.text)) {
        const username = getUsername(message.content.text);
        profileUsername = username;
        baseImage = await fetchProfileAvatar(profileUsername, scraper);
        elizaLogger.log(`Using specified profile image for ${profileUsername}`);
    }

    // 3. If no attachment, check for other qualifiers (@username)
    else if (hasAttachments) {
        baseImage = tweet.photos[0].url;
        elizaLogger.log("Using tweet attachment image");
    }

    // 4. Default to apple dog image (already set in baseImage)
    elizaLogger.log(`Final base image source: ${baseImage}`);

    // Construct prompt with appropriate context
    const shouldAddDescription = hasAttachments || profileUsername;

    // Generate response text
    const userPrompt = message.content.text;
    const getIntent = extractContent(userPrompt);

    console.log("============================================ INTENT TEST");
    console.log(getIntent);
    console.log("============================================ INTENT TEST");

    const prompt = `${getIntent} ${shouldAddDescription ? APPLE_DOG_DESCRIPTION : ""}`;
    elizaLogger.log(`Generated prompt: ${prompt}`);

    const { result } = await generateVideo({
        apiKey,
        prompt,
        baseImage,
        userId: message.userId,
    });

    return {
        result,
    };
};
