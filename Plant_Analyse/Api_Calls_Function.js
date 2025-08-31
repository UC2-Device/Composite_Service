import FormData from "form-data";
import axios from "axios";

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

 async function processAnalysis(image, organs, options = {}) {
  try {
    if (options.onlyPlant) {
      // ✅ Only plant detection
      const plantRes = await sendImageToApi(PLANT_API, image.buffer, image.originalname, { organs });
      const plantType = plantRes.toString();
        "Unknown";

      return { plant: plantType };
    }

    if (options.onlyHealth) {
      // ✅ Only health detection (requires plant type)
      const plantType = options.plant || "Unknown";
      const [waterRes, fertRes, diseaseRes] = await Promise.all([
        sendImageToApi(WATER_API, image.buffer, image.originalname, { plant: plantType }),
        sendImageToApi(FERT_API, image.buffer, image.originalname, { plant: plantType }),
        sendImageToApi(DISEASE_API, image.buffer, image.originalname, { plant: plantType }),
      ]);

      return {
        water_need: waterRes,
        fertilizer_need: fertRes,
        disease: diseaseRes,
      };
    }

    return {};
  } catch (error) {
    console.error("Error in processAnalysis:", error);
    throw error;
  }
}

export default processAnalysis;
export {sendImageToApi};