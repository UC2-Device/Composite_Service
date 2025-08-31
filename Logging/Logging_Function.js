import { Readable } from "stream";
import { storage, databases, ID } from "../Database/Appwrite_Database.js";

const BUCKET_ID = "68b351d80023a97e05e6";
const DATABASE_ID = "68b351aa0020e8eea52e";
const COLLECTION_ID = "68b351f7000f07c364d8";

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function logImage(plantType, fileBuffer) {
  try {
    const fileId = ID.unique();

    // Wrap buffer into Appwrite's expected format
    console.log(fileBuffer)
    const filePayload = {
      type: "file",
      name: `${fileId}.jpg`,
      size: fileBuffer.length,
      stream: bufferToStream(fileBuffer),
    };

    // Upload file
    await storage.createFile(BUCKET_ID, fileId, filePayload);

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
