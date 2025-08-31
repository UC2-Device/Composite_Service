import express from "express";
import { getDailyStatsByEmail, updateDailyStats as saveDailyStats} from "./Analyse_Data_Function";
import { getDailyStatsByEmail } from "./Analyse_Data_Function"; 

const router = express.Router();

router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { total_scans, area_utilised, health_need } = req.body;

    if (total_scans == null || area_utilised == null || health_need == null) {
      return res.status(400).json({ error: "total_scans, area_utilised, health_need are required" });
    }

    const stats = await saveDailyStats(req.user.device_id, { total_scans, area_utilised, health_need });

    res.json({ message: "Stats saved successfully", stats });
  } catch (err) {
    console.error("Error in /savestats:", err);
    res.status(500).json({ error: "Failed to save stats" });
  }
});

router.get("/", async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const stats = await getDailyStatsByEmail(email);
    res.json({ message: "Stats fetched successfully", stats });

  } catch (err) {
    console.error("Error in /getstats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
