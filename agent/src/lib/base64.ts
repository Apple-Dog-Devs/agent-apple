import { promises as fs } from "fs";
import path from "path";

export const toBase64 = async (imagePath: string): Promise<string> => {
    try {
        let buffer: Buffer;

        if (imagePath.startsWith("http")) {
            const response = await fetch(imagePath);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch image: ${response.statusText}`
                );
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            buffer = await fs.readFile(imagePath);
        }

        const contentType = getContentType(imagePath);

        const base64 = buffer.toString("base64");
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error("Error converting image:", error);
        throw error;
    }
};

function getContentType(filepath: string): string {
    const ext = path.extname(filepath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    };

    return contentTypes[ext] || "image/jpeg";
}
