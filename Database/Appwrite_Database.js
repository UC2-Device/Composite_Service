import { Client, Storage, Databases, ID } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();

const client = new Client();

client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT) // Your Appwrite endpoint
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)               // Your project ID
  .setKey(process.env.VITE_APPWRITE_APIKEY);                     // API key with storage write permission

// Export services
export const storage = new Storage(client);
export const databases = new Databases(client);
export { ID };
