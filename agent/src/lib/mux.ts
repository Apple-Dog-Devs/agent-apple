import fs from "fs";
import got from "got";
import Mux from "@mux/mux-node";

interface MuxUploadResponse {
    status: "success" | "error";
    playbackId?: string;
    message?: string;
}

const waitForThreeSeconds = () =>
    new Promise((resolve) => setTimeout(resolve, 3000));

export async function uploadToMux(
    videoUrl: string,
): Promise<MuxUploadResponse> {
    const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
    const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

    const mux = new Mux({
        tokenId: MUX_TOKEN_ID,
        tokenSecret: MUX_TOKEN_SECRET
    });

    try {
        const upload = await mux.video.uploads.create({
            cors_origin: '*',
            new_asset_settings: {
                playback_policy: ['public'],
                video_quality: 'basic',
                mp4_support: 'capped-1080p',
            }
        });

        got.put(upload.url, {
            body: fs.createReadStream(videoUrl),
        });

        let attempts = 0;

        while (attempts <= 10) {
            const result = await mux.video.uploads.retrieve(upload.id);

            if (result?.asset_id) {
                const asset = await mux.video.assets.retrieve(result?.asset_id);
                console.log(asset)
                if (asset && asset.status === "ready") {
                    return asset.playback_ids?.[0].id
                }
            } else {
                await waitForThreeSeconds();
                attempts++;
            }
        }


        // throw new Error("Asset processing timed out");
    } catch (error) {
        console.error("Mux upload error:", error);
        return {
            status: "error",
            message:
                error instanceof Error ? error.message : "Failed to upload to Mux",
        };
    }
}
