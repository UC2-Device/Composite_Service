import express from "express";
import multer from "multer";
import processAnalysis from "./api_calls_function.js";

const app = express();
const upload = multer(); // in-memory
app.use(express.json());

app.post(
  "/analyze",
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
  console.log("Composite API running on port 4000");
});
