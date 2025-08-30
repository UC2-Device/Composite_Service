// logger.js
import os from "os";
import { storage, databases, ID } from "../Database/Appwrite_Database";

const BUCKET_ID = "68b351d80023a97e05e6";         // Appwrite bucket for storing images
const DATABASE_ID = "68b351aa0020e8eea52e";     // Appwrite database
const COLLECTION_ID = "68b351f7000f07c364d8";         // Collection for image metadata

async function logImage(userId, sessionId, plantType, organs, imageBuffer) {
  try {
    // Skip logging if server load is high
    if (os.loadavg()[0] > 2.0) {
      console.log("⚠️ Server busy, skipping image log");
      return;
    }

    // ✅ Upload image to Appwrite bucket
    const fileId = ID.unique();
    await storage.createFile(
      BUCKET_ID,
      fileId,
      new File([imageBuffer], `${Date.now()}.jpg`, { type: "image/jpeg" })
    );

    // ✅ Save metadata in Appwrite database
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId,
      sessionId,
      plantType,
      organs,
      fileId,
      fileUrl: `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=your_project_id`,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Image logged for user ${userId}, session ${sessionId}`);
  } catch (error) {
    console.error("❌ Failed to log image:", error);
  }
}

export default logImage;
