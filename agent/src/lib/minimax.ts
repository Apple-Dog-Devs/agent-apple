"use server";

const MODEL = "video-01";
const BASE_URL = "https://api.minimaxi.chat/v1";

interface GenerateVideoParams {
    key: string;
    prompt: string;
    base: string;
}

interface InitResponse {
    taskId: string | null;
    error?: string;
}

interface StatusResponse {
    status: "success" | "processing" | "fail" | "error";
    error?: string;
    fileId?: string;
    downloadUrl: string | null;
    message?: string;
}

export async function initiateGeneration({
    key,
    prompt,
    base,
}: GenerateVideoParams): Promise<InitResponse> {
    try {
        const response = await fetch(`${BASE_URL}/video_generation`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                model: MODEL,
                watermark: "hailuo",
                prompt_optimizer: true,
                first_frame_image: base,
            }),
        });

        if (response.status === 429) {
            throw new Error(`Rate Limit Exceeded`);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { taskId: data.task_id };
    } catch (error) {
        console.error("Initiation error:", error);
        return {
            taskId: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to initiate video generation",
        };
    }
}

export async function checkGenerationStatus({
    key,
    taskId,
}): Promise<StatusResponse> {
    try {
        const queryResponse = await fetch(
            `${BASE_URL}/query/video_generation?task_id=${taskId}`,
            {
                headers: {
                    Authorization: `Bearer ${key}`,
                },
            }
        );

        if (!queryResponse.ok) {
            throw new Error(`HTTP error! status: ${queryResponse.status}`);
        }

        const queryResult = await queryResponse.json();
        console.log("query: ", queryResult);

        if (queryResult.status === "Success" && queryResult.file_id) {
            const fileResponse = await fetch(
                `${BASE_URL}/files/retrieve?file_id=${queryResult.file_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${key}`,
                    },
                }
            );

            if (!fileResponse.ok) {
                throw new Error(`HTTP error! status: ${fileResponse.status}`);
            }

            const fileData = await fileResponse.json();
            return {
                status: "success",
                downloadUrl: fileData.file.download_url,
                fileId: queryResult.file_id,
            };
        } else if (queryResult.status === "Fail") {
            return {
                status: "fail",
                downloadUrl: null,
                message: "Video generation failed",
            };
        }

        return {
            status: "processing",
            downloadUrl: null,
            message: "Still processing",
        };
    } catch (error) {
        console.error("Status check error:", error);
        return {
            status: "error",
            downloadUrl: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to check generation status",
        };
    }
}
