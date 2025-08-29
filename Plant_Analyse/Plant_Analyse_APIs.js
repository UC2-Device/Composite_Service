import express from "express";
import authMiddleware from "../Authentication/Authentication_Function.js";
import processAnalysis from "./Api_Calls_Function.js";
import multer from "multer";

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

export default router;
