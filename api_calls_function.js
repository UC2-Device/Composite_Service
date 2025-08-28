import FormData from "form-data";
import axios from "axios";

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

async function processAnalysis(image, organs, device_id) {
  
    const PLANT_API = "https://plant-detection-api.onrender.com/identify";
    const WATER_API = "https://water-stress-detection-api.onrender.com/detect_water_stress";
    const FERT_API = "https://nutrients-detection-api.onrender.com/detect_nutrient_deficiency";
    const DISEASE_API = "https://disease-detection-api-4fm3.onrender.com/detect_disease";

  const plantRes = await sendImageToApi(
    PLANT_API,
    image.buffer,
    image.originalname,
    { organs }
  );

  // Extract useful plant info
  let plantInfo = {};
  if (plantRes?.results?.length > 0) {
    const bestMatch = plantRes.results[0];
    plantInfo = {
      scientificName: bestMatch.species?.scientificName || "Unknown",
      commonNames: bestMatch.species?.commonNames || [],
      gbif_id: bestMatch.gbif?.id || null,
      powo_id: bestMatch.powo?.id || null,
      score: bestMatch.score || 0,
    };
  } else {
    plantInfo = { scientificName: "Unknown", commonNames: [] };
  }

  // ✅ Step 2: Run other three APIs in parallel
  const [waterRes, fertRes, diseaseRes] = await Promise.all([
    sendImageToApi(WATER_API, image.buffer, image.originalname, {
      plant: plantInfo.scientificName,
    }),
    sendImageToApi(FERT_API, image.buffer, image.originalname, {
      plant: plantInfo.scientificName,
    }),
    sendImageToApi(DISEASE_API, image.buffer, image.originalname, {
      plant: plantInfo.scientificName,
    }),
  ]);

  // ✅ Final result
  return {
    device_id,
    organs,
    plant: plantInfo,
    water_need: waterRes,
    fertilizer_need: fertRes,
    disease: diseaseRes,
    timestamp: new Date().toISOString(),
  };
}

export default processAnalysis;