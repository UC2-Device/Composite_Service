import express from "express";
import authMiddleware from "../Authentication/Authentication_Middleware.js";
import processAnalysis from "./Api_Calls_Function.js";
import multer from "multer";
import {User} from "../Database/Database.js";
import sessions from "../Authorization/Session_Data.js";

const router = express.Router();
const upload = multer();

// ✅ 1. Detect Plant Type
// ✅ 1. Detect Plant Type
router.post(
  "/plant",
  authMiddleware,
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
        plant: plantResult.plant,
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
  authMiddleware,
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
    } catch (error) {
      console.error("Error in /detect-health:", error);
      res.status(500).json({ error: "Failed to detect plant health issues" });
    }
  }
);

router.post("/startsession", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const organs = req.body?.organs;
    if (!image || !organs) {
      return res.status(400).json({ error: "Image and organs are required" });
    }

    const userId = req.user.device_id;
    const user = await User.findById(userId);
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

    // ✅ Detect plant
    const plantRes = await sendImageToApi(PLANT_API, image.buffer, image.originalname, { organs });
    const plantType = plantRes?.results?.[0]?.species?.commonNames?.[0] || "Unknown";

    // ✅ Create session
    const sessionId = Date.now().toString();

    sessions[sessionId] = {
      plant_type: plantType,
      remaining_calls: 15,
      created_at: today,
      userId: user._id,
    };

    // ✅ Mark session used
    user.used_sessions += 1;
    await user.save();

    res.json({
      session_id: sessionId,
      plant_type: plantType,
      remaining_calls: 15,
      sessions_left_today: user.total_sessions - user.used_sessions,
      subscription_days_left: daysLeft,
      subscription_warning: subscriptionWarning
    });

  } catch (err) {
    console.error("Error in /start-session:", err);
    res.status(500).json({ error: "Failed to start session" });
  }
});

export default router;
