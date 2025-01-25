import { elizaLogger } from "@elizaos/core";
import ffmpeg from "fluent-ffmpeg";

import fs from "fs";
import path from "path";

export const addAudio = async (videoUrl: string): Promise<string> => {
    const tempDir = "./temp";
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const tempVideoPath = path.join(tempDir, `temp_${Date.now()}_video.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);
    const audioPath = "./assets/background.mp3";

    try {
        // Download video with error handling
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
            elizaLogger.error(
                `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`
            );
        }

        const videoBlob = await videoResponse.blob();
        const videoBuffer = await videoBlob.arrayBuffer();
        fs.writeFileSync(tempVideoPath, new Uint8Array(videoBuffer));

        // Verify files exist
        if (!fs.existsSync(tempVideoPath)) {
            elizaLogger.error(`Video file not found at ${tempVideoPath}`);
        }
        if (!fs.existsSync(audioPath)) {
            elizaLogger.error(`Audio file not found at ${audioPath}`);
        }

        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempVideoPath)
                .input(audioPath)
                .outputOptions(["-c:v copy", "-c:a aac", "-shortest"])
                .save(outputPath)
                .on("start", (commandLine) => {
                    elizaLogger.info("FFmpeg command:", commandLine);
                })
                .on("progress", (progress) => {
                    elizaLogger.info("Processing:", progress.percent, "% done");
                })
                .on("stderr", (stderrLine) => {
                    elizaLogger.info("FFmpeg stderr:", stderrLine);
                })
                .on("end", () => {
                    try {
                        fs.unlinkSync(tempVideoPath); // Clean up temp file
                        if (fs.existsSync(outputPath)) {
                            resolve(outputPath);
                        } else {
                            reject(new Error("Output file not created"));
                        }
                    } catch (cleanupError) {
                        elizaLogger.error("Cleanup error:", cleanupError);
                        reject(cleanupError);
                    }
                })
                .on("error", (err, stdout, stderr) => {
                    elizaLogger.error("FFmpeg error details:", {
                        error: err.message,
                        stdout: stdout,
                        stderr: stderr,
                    });
                    reject(new Error(`FFmpeg process failed: ${err.message}`));
                });
        });
    } catch (error) {
        elizaLogger.error("Error in addAudio:", error);
        throw error;
    }
};
