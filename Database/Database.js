import mongoose from "mongoose";

async function connectDb(){
    try {
        await mongoose.connect(process.env.MONGO_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
        console.log("mongo db connected")
    } catch (error) {
        console.log("error in connnection",error.message);
    }
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate usernames
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate emails
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    device_id: {
      type: String,
      required: true,
      unique: true,       // ensures no duplicate device IDs
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,      // automatically adds createdAt & updatedAt
  }
);

// 2️⃣ Create the model
const User = mongoose.model("User", userSchema);

export default connectDb ;
export {User} ;