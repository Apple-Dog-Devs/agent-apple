"use server";

import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(1, "1 h"),
    analytics: true,
});

interface RateLimitResponse {
    success: boolean;
    limit?: number;
    remaining?: number;
    reset?: number;
    error?: string;
}

interface RateLimitProps {
    userId: string;
}

export async function checkRateLimit({
    userId,
}: RateLimitProps): Promise<RateLimitResponse> {
    try {
        const { success, limit, reset, remaining } =
            await ratelimit.limit(userId);

        if (!success) {
            return {
                success: false,
                limit,
                remaining: 0,
                reset,
                error: "Rate limit exceeded",
            };
        }

        return {
            success: true,
            limit,
            remaining,
            reset,
        };
    } catch (error) {
        console.error("Rate limit check failed:", error);
        return {
            success: false,
            error: "Failed to check rate limit",
        };
    }
}
