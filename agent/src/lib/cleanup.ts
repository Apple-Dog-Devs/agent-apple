import { elizaLogger } from "@elizaos/core";
import fs from "fs";
import path from "path";

/**
 * Deletes a file and its parent directory if empty
 * @param filePath Path to the file to delete
 * @returns Promise<boolean> True if cleanup was successful, false otherwise
 */
export const cleanupVideo = async (filePath: string): Promise<boolean> => {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            elizaLogger.warn(`File not found for cleanup: ${filePath}`);
            return false;
        }

        // Delete the file
        fs.unlinkSync(filePath);
        elizaLogger.info(`Successfully deleted file: ${filePath}`);

        // Get the directory path
        const dirPath = path.dirname(filePath);

        // Check if directory is empty
        const remainingFiles = fs.readdirSync(dirPath);
        if (remainingFiles.length === 0) {
            // Remove directory if empty
            fs.rmdirSync(dirPath);
            elizaLogger.info(`Removed empty directory: ${dirPath}`);
        }

        return true;
    } catch (error) {
        elizaLogger.error("Error during cleanup:", error);
        return false;
    }
};

/**
 * Cleans up all files in the temp directory
 * @returns Promise<boolean> True if cleanup was successful, false otherwise
 */
export const cleanupAllTempFiles = async (): Promise<boolean> => {
    const tempDir = "./temp";
    try {
        if (!fs.existsSync(tempDir)) {
            elizaLogger.info("Temp directory does not exist, nothing to clean");
            return true;
        }

        const files = fs.readdirSync(tempDir);
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            fs.unlinkSync(filePath);
            elizaLogger.info(`Deleted temp file: ${filePath}`);
        }

        // Remove the temp directory itself
        fs.rmdirSync(tempDir);
        elizaLogger.info("Removed temp directory");

        return true;
    } catch (error) {
        elizaLogger.error("Error cleaning up temp directory:", error);
        return false;
    }
};
