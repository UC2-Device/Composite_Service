import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import processAnalysis from "./api_calls_function.js";
import authMiddleware from "./authentication_function.js";

dotenv.config();
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const upload = multer();

const users = [];

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: "Username and password required" });

    const exists = users.find((u) => u.username === username);
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    users.push({ username, password: hashed });

    res.json({ message: "Signup successful" });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = users.find((u) => u.username === username);
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
});

app.post(
    "/analyze",
    authMiddleware, // 🔒 require token
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "organs", maxCount: 1 },
        { name: "device_id", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const image = req.files?.image?.[0];
            const organs = req.body?.organs;
            const device_id = req.body?.device_id;

            if (!image) {
                return res.status(400).json({ error: "Image file is required" });
            }
            if (!organs) {
                return res.status(400).json({ error: "Organs field is required" });
            }

            const result = await processAnalysis(image, organs, device_id);
            res.json(result);
        } catch (error) {
            console.error("Error in /analyze:", error);
            res.status(500).json({ error: "Failed to process request" });
        }
    }
);

app.listen(4000, () => {
    console.log("Composite API with Auth running on port 4000");
});
