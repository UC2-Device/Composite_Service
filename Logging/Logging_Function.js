import { InputFile } from "node-appwrite";
import { storage, databases, ID } from "../Database/Appwrite_Database.js";

const BUCKET_ID = "68b351d80023a97e05e6";
const DATABASE_ID = "68b351aa0020e8eea52e";
const COLLECTION_ID = "68b351f7000f07c364d8";

async function logImage(plantType, fileBuffer, originalName = "upload.jpg") {
  try {
    const fileId = ID.unique();

    // Wrap file properly
    const file = InputFile.fromBuffer(fileBuffer, originalName);

    // Upload file
    await storage.createFile(BUCKET_ID, fileId, file);

    // Store metadata
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      plantType,
      fileId,
      fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=your_project_id`,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Image logged with fileId: ${fileId}`);
  } catch (error) {
    console.error("❌ Failed to log image:", error);
  }
}

export default logImage;
