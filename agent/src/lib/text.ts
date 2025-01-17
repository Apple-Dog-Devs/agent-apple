import nlp from "compromise";

import { KEYWORDS } from "./constants.ts";

// Text extraction utility functions
export const extractContent = (text: string): string => {
    // Look for @apple_xbt followed by the command
    const commandMatch = text.match(/@apple_xbt\s+(.*)/i);

    if (commandMatch && commandMatch[1]) {
        // Return the text that comes after @apple_xbt
        return commandMatch[1].trim();
    }

    // If no match is found, return the original text
    return text.trim();
};

export const getIntent = (text: string): string => {
    // Step 1: Remove mentions (@username)
    const withoutMentions = text.replace(/@\w+/g, "").trim();

    // Step 2: Isolate and preserve hashtags (e.g., #example)
    const withoutHashtags = withoutMentions
        .replace(/#[a-zA-Z0-9_]+/g, "")
        .trim();

    // Step 3: Remove URLs
    const withoutUrls = withoutHashtags.replace(/https?:\/\/\S+/g, "").trim();

    // Step 4: Normalize emojis and other symbols (optional)
    const normalizedText = withoutUrls.replace(/[^\w\s#]/g, "").trim();

    const doc = nlp(normalizedText);

    const relevantSentences = doc
        .sentences()
        .filter((sentence) =>
            KEYWORDS.some((keyword) =>
                sentence.text().toLowerCase().includes(keyword)
            )
        )
        .out("array");

    return relevantSentences.join(" ") || "No relevant content found";
};
