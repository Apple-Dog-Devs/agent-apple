import { checkGenerationStatus } from "./minimax";
import { elizaLogger } from "@elizaos/core";

interface StatusResult {
    status: string;
    downloadUrl?: string;
    fileId?: string;
    error?: string;
}

interface GenerationProps {
    key: string;
    taskId: string;
    maxAttempts?: number;
    interval?: number;
    userId?: string;
}

interface QueuedTask {
    task: () => Promise<any>;
    timestamp: number;
    priority: number;
}

class CircuitBreaker {
    private failures: Map<string, { count: number; lastFailure: number }> =
        new Map();
    private readonly maxFailures: number = 5;
    private readonly resetTimeout: number = 5 * 60 * 1000; // 5 minutes

    isOpen(userId: string): boolean {
        const userFailures = this.failures.get(userId);
        if (!userFailures) return false;

        const now = Date.now();
        if (now - userFailures.lastFailure > this.resetTimeout) {
            this.failures.delete(userId);
            return false;
        }

        return userFailures.count >= this.maxFailures;
    }

    recordFailure(userId: string) {
        const current = this.failures.get(userId) || {
            count: 0,
            lastFailure: 0,
        };
        this.failures.set(userId, {
            count: current.count + 1,
            lastFailure: Date.now(),
        });
    }

    reset(userId: string) {
        this.failures.delete(userId);
    }
}

class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs: number = 60 * 1000; // 1 minute window
    private readonly maxRequests: number = 10; // max requests per window

    canProcess(userId: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Clean old requests
        const recentRequests = userRequests.filter(
            (time) => now - time < this.windowMs
        );

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.requests.set(userId, recentRequests);
        return true;
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, requests] of this.requests.entries()) {
            const valid = requests.filter((time) => now - time < this.windowMs);
            if (valid.length === 0) {
                this.requests.delete(userId);
            } else {
                this.requests.set(userId, valid);
            }
        }
    }
}

class ThreadPool {
    private activeThreads: Map<string, Set<string>> = new Map(); // userId -> Set of taskIds
    private queue: Map<string, QueuedTask[]> = new Map();
    private globalActiveThreads: number = 0;
    private circuitBreaker: CircuitBreaker = new CircuitBreaker();
    private rateLimiter: RateLimiter = new RateLimiter();
    private lastCleanup: number = Date.now();

    private readonly maxThreadsPerUser: number;
    private readonly maxGlobalThreads: number;
    private readonly maxQueueSize: number = 100;
    private readonly queueTimeout: number = 10 * 60 * 1000; // 10 minutes
    private readonly cleanupInterval: number = 5 * 60 * 1000; // 5 minutes

    constructor(maxThreadsPerUser: number = 2, maxGlobalThreads: number = 10) {
        this.maxThreadsPerUser = maxThreadsPerUser;
        this.maxGlobalThreads = maxGlobalThreads;
        elizaLogger.log(
            `ThreadPool initialized with maxThreadsPerUser: ${maxThreadsPerUser}, maxGlobalThreads: ${maxGlobalThreads}`
        );
    }

    async execute(
        userId: string,
        taskId: string,
        task: () => Promise<any>
    ): Promise<any> {
        await this.performHealthCheck();

        // Check circuit breaker
        if (this.circuitBreaker.isOpen(userId)) {
            throw new Error(
                "Too many recent failures. Please try again later."
            );
        }

        // Check rate limit
        if (!this.rateLimiter.canProcess(userId)) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        const userThreads = this.activeThreads.get(userId) || new Set();
        elizaLogger.log(
            `[ThreadPool] User ${userId} attempting to execute task ${taskId}. Active threads: ${userThreads.size}, Global: ${this.globalActiveThreads}`
        );

        // Check if task is already running
        if (userThreads.has(taskId)) {
            elizaLogger.log(
                `[ThreadPool] Task ${taskId} is already running for user ${userId}`
            );
            throw new Error("Task is already running");
        }

        if (
            userThreads.size >= this.maxThreadsPerUser ||
            this.globalActiveThreads >= this.maxGlobalThreads
        ) {
            return this.queueTask(userId, taskId, task);
        }

        return this.runTask(userId, taskId, task);
    }

    private async runTask(
        userId: string,
        taskId: string,
        task: () => Promise<any>
    ): Promise<any> {
        this.addActiveThread(userId, taskId);

        try {
            const result = await task();
            this.circuitBreaker.reset(userId);
            return result;
        } catch (error) {
            this.circuitBreaker.recordFailure(userId);
            throw error;
        } finally {
            this.removeActiveThread(userId, taskId);
            this.processQueue(userId);
        }
    }

    private async queueTask(
        userId: string,
        taskId: string,
        task: () => Promise<any>
    ): Promise<any> {
        const userQueue = this.queue.get(userId) || [];

        if (userQueue.length >= this.maxQueueSize) {
            throw new Error("Queue limit reached for user");
        }

        elizaLogger.log(
            `[ThreadPool] Queueing task ${taskId} for user ${userId}. Queue length: ${userQueue.length}`
        );

        return new Promise((resolve, reject) => {
            userQueue.push({
                task: async () => {
                    try {
                        const result = await this.runTask(userId, taskId, task);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                },
                timestamp: Date.now(),
                priority: userQueue.length,
            });
            this.queue.set(userId, userQueue);
        });
    }

    private addActiveThread(userId: string, taskId: string) {
        const userThreads = this.activeThreads.get(userId) || new Set();
        userThreads.add(taskId);
        this.activeThreads.set(userId, userThreads);
        this.globalActiveThreads++;
        elizaLogger.log(
            `[ThreadPool] Added task ${taskId} for user ${userId}. Active threads: ${userThreads.size}, Global: ${this.globalActiveThreads}`
        );
    }

    private removeActiveThread(userId: string, taskId: string) {
        const userThreads = this.activeThreads.get(userId);
        if (userThreads) {
            userThreads.delete(taskId);
            if (userThreads.size === 0) {
                this.activeThreads.delete(userId);
            }
            this.globalActiveThreads--;
            elizaLogger.log(
                `[ThreadPool] Removed task ${taskId} for user ${userId}. Remaining threads: ${userThreads.size}, Global: ${this.globalActiveThreads}`
            );
        }
    }

    private async processQueue(userId: string) {
        const userQueue = this.queue.get(userId) || [];
        const userThreads = this.activeThreads.get(userId) || new Set();

        if (
            userQueue.length > 0 &&
            userThreads.size < this.maxThreadsPerUser &&
            this.globalActiveThreads < this.maxGlobalThreads
        ) {
            const nextTask = userQueue.shift();
            if (nextTask) {
                this.queue.set(userId, userQueue);
                await nextTask.task();
            }
        }
    }

    private async performHealthCheck() {
        const now = Date.now();
        if (now - this.lastCleanup > this.cleanupInterval) {
            elizaLogger.log("[ThreadPool] Performing health check and cleanup");

            // Clean up stale queued tasks
            for (const [userId, queue] of this.queue.entries()) {
                const validTasks = queue.filter(
                    (task) => now - task.timestamp < this.queueTimeout
                );
                if (validTasks.length === 0) {
                    this.queue.delete(userId);
                } else {
                    this.queue.set(userId, validTasks);
                }
            }

            // Clean up rate limiter
            this.rateLimiter.cleanup();

            this.lastCleanup = now;
        }
    }

    getStatus(userId?: string) {
        if (userId) {
            const status = {
                activeThreads: this.activeThreads.get(userId)?.size || 0,
                queuedTasks: this.queue.get(userId)?.length || 0,
                isCircuitBreakerOpen: this.circuitBreaker.isOpen(userId),
            };
            elizaLogger.log(`[ThreadPool] Status for user ${userId}:`, status);
            return status;
        }

        const status = {
            globalActiveThreads: this.globalActiveThreads,
            totalQueuedTasks: Array.from(this.queue.values()).reduce(
                (sum, queue) => sum + queue.length,
                0
            ),
            totalUsers: this.activeThreads.size,
        };
        elizaLogger.log(`[ThreadPool] Global status:`, status);
        return status;
    }
}

const threadPool = new ThreadPool();

export async function watchGenerationStatus({
    key,
    taskId,
    maxAttempts = 20, // 20 attempts for 10 minutes total
    interval = 30000, // Check every 30 seconds
    userId = "default",
}: GenerationProps): Promise<StatusResult> {
    elizaLogger.log(
        `[watchGenerationStatus] Starting watch for taskId: ${taskId}, userId: ${userId}`
    );

    return threadPool.execute(userId, taskId, async () => {
        let attempts = 0;
        while (attempts < maxAttempts) {
            elizaLogger.log(
                `[watchGenerationStatus] Checking status for taskId: ${taskId}, attempt: ${attempts + 1}/${maxAttempts}`
            );

            const statusResult = await checkGenerationStatus({ key, taskId });
            elizaLogger.log(
                `[watchGenerationStatus] Status result for taskId ${taskId}:`,
                statusResult.status
            );

            if (statusResult.status === "success") {
                elizaLogger.log(
                    `[watchGenerationStatus] Task ${taskId} completed successfully`
                );
                return statusResult;
            }
            if (
                statusResult.status === "fail" ||
                statusResult.status === "error"
            ) {
                elizaLogger.error(
                    `[watchGenerationStatus] Task ${taskId} failed:`,
                    statusResult.error
                );
                throw new Error(statusResult.error || "Generation failed");
            }

            elizaLogger.log(
                `[watchGenerationStatus] Waiting ${interval}ms before next check for taskId: ${taskId}`
            );
            await new Promise((resolve) => setTimeout(resolve, interval));
            attempts++;
        }

        elizaLogger.error(
            `[watchGenerationStatus] Task ${taskId} timed out after 10 minutes`
        );
        throw new Error("Operation timed out after 10 minutes");
    });
}

export function configureThreadPool(
    maxThreadsPerUser: number,
    maxGlobalThreads: number
) {
    elizaLogger.log(
        `[configureThreadPool] Configuring new thread pool with maxThreadsPerUser: ${maxThreadsPerUser}, maxGlobalThreads: ${maxGlobalThreads}`
    );
    return new ThreadPool(maxThreadsPerUser, maxGlobalThreads);
}

export function getThreadStatus(userId?: string) {
    elizaLogger.log(
        `[getThreadStatus] Getting status${userId ? ` for user ${userId}` : " global"}`
    );
    return threadPool.getStatus(userId);
}
