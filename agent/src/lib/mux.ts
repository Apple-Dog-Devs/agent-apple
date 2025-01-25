interface MuxUploadResponse {
    status: "success" | "error";
    playbackId?: string;
    message?: string;
}

export async function uploadToMux(
    videoUrl: string,
): Promise<MuxUploadResponse> {
    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;
    const MUX_API_BASE = "https://api.mux.com/video/v1";

    try {
        // Create new asset
        const createAssetResponse = await fetch(`${MUX_API_BASE}/assets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64")}`,
            },
            body: JSON.stringify({
                input: videoUrl,
                playback_policy: ["public"],
                mp4_support: "capped-1080p",
                new_asset_settings: {
                    playback_policy: ["public"],
                    mp4_support: "capped-1080p",
                },
            }),
        });

        if (!createAssetResponse.ok) {
            throw new Error(
                `Failed to create asset: ${createAssetResponse.statusText}`,
            );
        }

        const asset = await createAssetResponse.json();
        const assetId = asset.data.id;

        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
            const checkAssetResponse = await fetch(
                `${MUX_API_BASE}/assets/${assetId}`,
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64")}`,
                    },
                },
            );

            if (!checkAssetResponse.ok) {
                throw new Error(
                    `Failed to check asset status: ${checkAssetResponse.statusText}`,
                );
            }

            const assetStatus = await checkAssetResponse.json();
            console.log("Asset status:", assetStatus);

            if (assetStatus.data.status === "ready") {
                return {
                    status: "success",
                    playbackId: assetStatus.data.playback_ids[0].id,
                };
            } else if (assetStatus.data.status === "errored") {
                throw new Error("Asset processing failed");
            }

            // Wait 2 seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            attempts++;
        }

        throw new Error("Asset processing timed out");
    } catch (error) {
        console.error("Mux upload error:", error);
        return {
            status: "error",
            message:
                error instanceof Error ? error.message : "Failed to upload to Mux",
        };
    }
}
