import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import processAnalysis from "./api_calls_function.js";


dotenv.config();
const app = express();
const upload = multer();
app.use(express.json());

// 🔑 JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// 🌍 MongoDB Connection
// const uri = process.env.MONGO_URI; // keep URI in .env for security
// const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1 }, tlsInsecure: true });

const connectDb = async ()=>{
    try {
        await mongoose.connect("mongodb+srv://chiragbansal112004:chiragbansal112004@uc2d.2equ09j.mongodb.net/UC2D_portals",{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
        console.log("mongo db connected")
    } catch (error) {
        console.log("error in connnection",error.message);
    }
}

connectDb();

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate usernames
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate emails
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    device_id: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate device IDs
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,      // automatically adds createdAt & updatedAt
  }
);

// 2️⃣ Create the model
const User = mongoose.model("User", userSchema);


function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Signup
 */
app.post("/signup", async (req, res) => {
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


/**
 * Login
 */
app.post("/login", async (req, res) => {
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

/**
 * Analyze (Protected)
 */
app.post(
  "/analyze",
  authMiddleware,
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

      if (!image) return res.status(400).json({ error: "Image file is required" });
      if (!organs) return res.status(400).json({ error: "Organs field is required" });

      const result = await processAnalysis(image, organs, device_id);
      res.json(result);
    } catch (error) {
      console.error("Error in /analyze:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  }
);

app.listen(4000, () => {
  console.log("🚀 Composite API with Auth running on port 4000");
});
