import mongoose from "mongoose";

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log("mongo db connected")
  } catch (error) {
    console.log("error in connnection", error.message);
  }
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  device_id: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  total_sessions: { type: Number, default: 1 },   // per-day sessions allowed
  used_sessions: { type: Number, default: 0 },    // per-day sessions used
  last_session_date: { type: String, default: null },

  subscription_end: { type: Date, required: true } // when plan expires
});


const DailyStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true }, // ✅ Added for identification

  // Store as fixed-length arrays for 30 days
  total_scans: { type: [Number], default: () => Array(30).fill(0) },
  area_utilised: { type: [Number], default: () => Array(30).fill(0) },
  health_need: { type: [Number], default: () => Array(30).fill(0) },

  updated_at: { type: Date, default: Date.now },
});

const DailyStats = mongoose.model("DailyStats", DailyStatsSchema);
const User = mongoose.model("User", userSchema);

export default connectDb;
export { User };
export {DailyStats};