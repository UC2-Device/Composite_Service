import { DailyStats } from "../Database/Mongo_Database.js";
import { User } from "../Database/Mongo_Database.js";

function getDayIndex() {
  const today = new Date().getDate(); // 1–31
  return (today - 1) % 30; // index 0–29
}

export async function updateDailyStats(device_id, scans = 0, area = 0, health = 0 ) {
  const dayIndex = getDayIndex();

  const user = await User.findOne({device_id}).select("email");
  if (!user) throw new Error("User not found");
  
  let stats = await DailyStats.findOne({userId :  device_id });
  if (!stats) {
    stats = new DailyStats({ userId : device_id, email: user.email });
  }

  stats.total_scans[dayIndex] += scans;
  stats.area_utilised[dayIndex] += area;
  stats.health_need[dayIndex] += health;

  stats.updated_at = new Date();
  await stats.save();
}

export async function getDailyStatsById(userId) {
  const stats = await DailyStats.findOne({ userId  });
  const user = await User.findOne({device_id : userId});

  if (!stats) {
    throw new Error("No stats found for this email");
  }

  return {
    email: stats.email,
    total_scans: stats.total_scans,
    area_utilised: user.plan == "normal" ? "premium required" : stats.area_utilised,
    health_need: stats.health_need,
    updated_at: stats.updated_at,
  };
}