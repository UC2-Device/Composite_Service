import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import {User} from "../Database/Database.js";

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, device_id, password } = req.body;

    if (!username || !email || !phone || !device_id || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 🔍 Check for existing user
    const exists = await User.findOne({
      $or: [{ username }, { email }, { device_id }],
    });

    if (exists) {
      return res.status(400).json({ error: "Username, email, or device_id already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create new user document
    const newUser = new User({ username, email, phone, device_id, password: hashed });
    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // 🔍 Find user by username
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    // 🔑 Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    // 📝 Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, device_id: user.device_id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});


export default router ;