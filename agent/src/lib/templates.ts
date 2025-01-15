export const TEMPLATES = {
    generationSuccess: (message: string) => `
        Create a concise tweet response to a video successfully generated using the text: ‘${message}’ as the video description. The response should follow this format: ‘Here’s your video of {{prompt}}. [Custom positive or engaging comment] $apple’. Assume the incoming text is from a tweet and may be slightly malformed or informal, but infer the intended meaning as best as possible. Do not use hashtags.`,
    generationError: `create a formal but chill tweet outlining that a video failed to generate due to not meeting generation requirements. don't mention '$apple'. and say you've let the team know. make it one line`,
};
