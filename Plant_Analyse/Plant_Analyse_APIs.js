import express from "express";
import authMiddleware from "../Authentication/Authentication_Middleware.js";
import processAnalysis from "./Api_Calls_Function.js";
import multer from "multer";
import { User } from "../Database/Mongo_Database.js";
import sessions from "../Authorization/Session_Data.js";
import sessionAuth from "../Authorization/Authorization_MIddleware.js";
// import sendImageToApi from "../Plant_Analyse/Api_Calls_Function.js"
import logImage from "../Logging/Logging_Function.js";

const router = express.Router();
const upload = multer();

// ✅ 1. Detect Plant Type
// ✅ 1. Detect Plant Type
router.post(
  "/plant",
  authMiddleware,sessionAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "organs", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const image = req.files?.image?.[0];
      const organs = req.body?.organs;

      if (!image) return res.status(400).json({ error: "Image file is required" });
      if (!organs) return res.status(400).json({ error: "Organs field is required" });

      // Call processAnalysis but only for plant detection
      const plantResult = await processAnalysis(image, organs, { onlyPlant: true });

      res.json({
        plant: plantResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in /detect-plant:", error);
      res.status(500).json({ error: "Failed to detect plant type" });
    }
  }
);

// ✅ 2. Detect Health Issues (Water, Fertilizer, Disease)
router.post(
  "/health",
  authMiddleware,sessionAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "plant", maxCount: 1 }, // pass detected plant type here
  ]),
  async (req, res) => {
    try {
      const image = req.files?.image?.[0];
      const plantType = req.body?.plant;

      if (!image) return res.status(400).json({ error: "Image file is required" });
      if (!plantType) return res.status(400).json({ error: "Plant type is required" });

      // Call processAnalysis but only for health detection
      const healthResult = await processAnalysis(image, null, { onlyHealth: true, plant: plantType });

      res.json({
        plant: plantType,
        water_need: healthResult.water_need,
        fertilizer_need: healthResult.fertilizer_need,
        disease: healthResult.disease,
        timestamp: new Date().toISOString(),
      });

      logImage(plantType, image);

    } catch (error) {
      console.error("Error in /detect-health:", error);
      res.status(500).json({ error: "Failed to detect plant health issues" });
    }
  }
);


router.post("/", authMiddleware, sessionAuth, upload.single("image"), async (req, res) => {
  try {
    const { sessionId, organs } = req.body;
    const image = req.file;

    if (!image || !sessionId || !organs) {
      return res.status(400).json({ error: "Image, sessionId, and organs are required" });
    }

    // 🔎 Fetch session from DB
    const session = sessions[sessionId];

    let result = {};
    const plantType = session.plant_type;

    if (session.plan === "normal") {
      // ✅ Health only
      const healthResult = await processAnalysis(image, null, { onlyHealth: true, plant: plantType });

      result = { plant: plantType, water_need: healthResult.water_need, fertilizer_need: healthResult.fertilizer_need, disease: healthResult.disease };

    } else if (session.plan === "premium") {
      // ✅ Full suite
      const healthResult = await processAnalysis(image, null, { onlyHealth: true, plant: plantType });
      const plantRes = await processAnalysis(image, organs, { onlyPlant: true });

      result = {
        plant: plantRes.toString(),
        water_need: healthResult.water_need,
        fertilizer_need: healthResult.fertilizer_need,
        disease: healthResult.disease,
      };
    }

    res.json({
      ...result,
      remaining_calls: session.remaining_calls - 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /analyze:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});


router.post("/startsession", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const organs = req.body?.organs;
    if (!image || !organs) {
      return res.status(400).json({ error: "Image and organs are required" });
    }

    const userId = req.user.device_id;
    const user = await User.findOne({ device_id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];

    // ✅ Reset sessions if it's a new day
    if (user.last_session_date !== today) {
      user.used_sessions = 0;
      user.last_session_date = today;
    }

    // ✅ Check if sessions left
    if (user.used_sessions >= user.total_sessions) {
      return res.status(403).json({ error: "No sessions left for today. Upgrade or wait until tomorrow." });
    }

    // ✅ Subscription check
    const now = new Date();
    const daysLeft = Math.ceil((user.subscription_end - now) / (1000 * 60 * 60 * 24));
    let subscriptionWarning = null;
    if (daysLeft <= 5) {
      subscriptionWarning = `Your subscription will expire in ${daysLeft} day(s). Please renew soon.`;
    }
    if (daysLeft <= 0) {
      return res.status(403).json({ error: "Subscription expired. Please renew to continue." });
    }

    // ✅ Detect plant (only once at session start)
    const plantRes = await processAnalysis(image, organs, { onlyPlant: true });
    const plantType = plantRes.toString();

    // ✅ Create session with user plan embedded
    const sessionId = Date.now().toString();
    sessions[sessionId] = {
      plant_type: plantType,
      remaining_calls: 2,     // always per session
      created_at: today,
      userId: user.device_id,
      plan: user.plan           // 👈 store user plan here
    };

    // ✅ Mark session used
    user.used_sessions += 1;
    await user.save();

    res.json({
      session_id: sessionId,
      plant_type: plantType,
      plan: user.plan, // 👈 tell frontend what plan is active
      remaining_calls: 360,
      sessions_left_today: user.total_sessions - user.used_sessions,
      subscription_days_left: daysLeft,
      subscription_warning: subscriptionWarning
    });

  } catch (err) {
    console.error("Error in /startsession:", err);
    res.status(500).json({ error: "Failed to start session" });
  }
});


export default router;
