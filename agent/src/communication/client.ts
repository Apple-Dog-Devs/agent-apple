import { elizaLogger, IAgentRuntime } from "@elizaos/core";

import { generateVideo } from "../lib/minimax.ts";
import { PROMPTS } from "../lib/constants.ts";
import {DiscordClient} from "@elizaos/client-discord";

interface TwitterPostClient {
    sendTweet: (
        text: string,
        inReplyToId?: string | null,
        mediaData?: Array<{ data: Buffer; mediaType: string }>
    ) => Promise<void>;
}

export interface CustomTwitterClient {
    post: {
        client: {
            twitterClient: TwitterPostClient;
        };
    };
}

export class TweetCron {
    private twitterClient: CustomTwitterClient;
    private intervalId?: NodeJS.Timeout;
    private runtime: IAgentRuntime;

    private readonly DEFAULT_INTERVAL = 6 * 60 * 60 * 1000;

    constructor(twitterClient: CustomTwitterClient, runtime: IAgentRuntime) {
        this.twitterClient = twitterClient;
        this.runtime = runtime;

        this.start(runtime);
    }

    public async start(runtime: IAgentRuntime): Promise<void> {
        const tweetAction = async () => {
            const baseImage = runtime.getSetting("APPLE_DOG_IMAGE");
            const apiKey = runtime.getSetting("MINIMAXI_API_KEY");

            const randomPrompt = this.getRandomPrompt();

            const { result } = await generateVideo({
                apiKey,
                prompt: randomPrompt.prompt,
                baseImage,
                userId: "agent-apple",
            });

            const videoBuffer = await this.downloadVideo(result.downloadUrl);

            const mediaData = [
                {
                    data: videoBuffer,
                    mediaType: "video/mp4",
                },
            ];

            await this.twitterClient.post.client.twitterClient.sendTweet(
                randomPrompt.title,
                null,
                mediaData
            );

            elizaLogger.info("Tweet posted successfully!");
        };

        await tweetAction();

        this.intervalId = setInterval(async () => {
            try {
                await tweetAction();
            } catch (error) {
                elizaLogger.error("Failed to post tweet:", error);
            }
        }, this.DEFAULT_INTERVAL);
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            elizaLogger.info("Market tweet cron stopped");
        }
    }

    private getRandomPrompt(): { title: string; prompt: string } {
        const randomIndex = Math.floor(Math.random() * PROMPTS.length);
        return PROMPTS[randomIndex];
    }

    private async downloadVideo(url: string): Promise<Buffer> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
