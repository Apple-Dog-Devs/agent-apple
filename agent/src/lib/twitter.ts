import { elizaLogger } from "@elizaos/core";

const QUALIFIERS = ["profile", "profile picture", "pfp"];

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
