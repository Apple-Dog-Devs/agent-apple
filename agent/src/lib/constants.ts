export const KEYWORDS = ["generate", "make", "create", "video"];

export const QUALIFIERS = ["profile", "profile picture", "pfp", 'profile pic'];

export const APPLE_DOG_DESCRIPTION =
    "A long nose dachshund appears with blonde hair on his body and face. His ears are brown and he is wearing a blue low cut sweater with an apple in his mouth";

export const TEMPLATES = {
    generationSuccess: (message: string) => `
        Create a concise tweet response to a video successfully generated using the text: ‘${message}’ as the video description. The response should follow this format: ‘Here’s your video of {{prompt}}. [Custom positive or engaging comment] $apple’. Assume the incoming text is from a tweet and may be slightly malformed or informal, but infer the intended meaning as best as possible. Do not use hashtags.`,
    generationError: `write a short, friendly tweet for a failed video generation. Acknowledge the issue, reassure the user that the team is aware, and keep the tone calm and casual. No hashtags or ‘$apple.’`,
};
