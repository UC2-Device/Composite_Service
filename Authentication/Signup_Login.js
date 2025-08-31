import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import { User } from "../Database/Mongo_Database.js";

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

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

import crypto from "crypto";
import bcrypt from "bcrypt";
import sendMail from "../mailer.js";
import { User } from "../Database/Mongo_Database.js";

router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, device_id, password } = req.body;

    if (!username || !email || !phone || !device_id || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if already registered
    const exists = await User.findOne({ $or: [{ email }, { phone }, { device_id }] });
    if (exists) return res.status(400).json({ error: "Email, phone, or device_id already registered" });

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString("hex");

    // Store temporarily (expires in 10 mins)

    pendingVerifications[token] = {
      data: { username, email, phone, device_id, password },
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    };

    // Send OTP via email
    sendMail({
      to: email,
      subject: "Verify your account",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    });

    res.json({ message: "OTP sent to email. Please verify.", token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/verify_otp", async (req, res) => {
  try {
    const { token, otp } = req.body;

    const entry = pendingVerifications[token];
    if (!entry) return res.status(400).json({ error: "Invalid or expired request" });

    if (entry.expiresAt < Date.now()) {
      delete pendingVerifications[token];
      return res.status(400).json({ error: "OTP expired" });
    }

    if (entry.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Save user to DB
    const data = entry.data;
    const hashed = await bcrypt.hash(data.password, 10);
    const last_session_date = new Date().toISOString().split("T")[0];

    const today = new Date();
    const futureDate = new Date(today); // clone today
    futureDate.setDate(today.getDate() + 10);

    const newUser = new User({
      username: data.username,
      email: data.email,
      phone: data.phone,
      device_id: data.device_id,
      password: hashed,
      used_sessions: 0,
      last_session_date,
      subscription_end: futureDate,
      total_sessions: 1,
      plan: "normal",
    });

    await newUser.save();

    // Clean up
    delete pendingVerifications[token];

    res.json({ message: "User verified and registered successfully." });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/forgot_password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString("hex");

    pendingPasswordResets[token] = {
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    sendMail({
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    });

    res.json({ message: "OTP sent to email.", token });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// Verify OTP and reset password
router.post("/reset_password", async (req, res) => {
  try {
    const { token, otp, newPassword } = req.body;
    if (!token || !otp || !newPassword) {
      return res.status(400).json({ error: "Token, OTP, and newPassword are required" });
    }

    const entry = pendingPasswordResets[token];
    if (!entry) return res.status(400).json({ error: "Invalid or expired reset request" });

    if (entry.expiresAt < Date.now()) {
      delete pendingPasswordResets[token];
      return res.status(400).json({ error: "OTP expired" });
    }

    if (entry.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email: entry.email }, { $set: { password: hashed } });

    delete pendingPasswordResets[token];

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

export default router;