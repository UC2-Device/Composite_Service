import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const app = express();
const upload = multer(); // no disk storage, keep in memory
app.use(express.json());

// Flask API endpoints
const PLANT_API = "https://plant-detection-api.onrender.com/identify";
const WATER_API = "https://water-stress-detection-api.onrender.com/detect_water_stress";
const FERT_API = "https://nutrients-detection-api.onrender.com/detect_nutrient_deficiency";
const DISEASE_API = "https://disease-detection-api-4fm3.onrender.com/detect_disease";

async function sendImageToApi(apiUrl, fileBuffer, fileName, extraFields = {}) {
  const formData = new FormData();
  formData.append("images", fileBuffer, fileName);

  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, value);
  }

  const response = await axios.post(apiUrl, formData, {
    headers: formData.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

app.post(
  "/analyze",
  upload.fields([
    { name: "image", maxCount: 1 }, // image file
    { name: "organs", maxCount: 1 }, // optional text field
    { name: "device_id", maxCount: 1 }, // optional text field
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

      // ✅ Step 1: Plant Detection
      const plantRes = await sendImageToApi(
        PLANT_API,
        image.buffer,
        image.originalname,
        { organs }
      );
      
      const plantType = plantRes.lenght != 0 ? plantRes.toString() : "Unknown";

      // ✅ Step 2: Run other three APIs in parallel
      const [waterRes, fertRes, diseaseRes] = await Promise.all([
        sendImageToApi(WATER_API, image.buffer, image.originalname, { plant: plantType }),
        sendImageToApi(FERT_API, image.buffer, image.originalname, { plant: plantType }),
        sendImageToApi(DISEASE_API, image.buffer, image.originalname, { plant: plantType }),
      ]);

      res.json({
        device_id,
        organs,
        plant: plantType,
        water_need: waterRes,
        fertilizer_need: fertRes,
        disease: diseaseRes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in /analyze:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  }
);

app.listen(4000, () => {
  console.log("Composite API running on port 4000");
});
