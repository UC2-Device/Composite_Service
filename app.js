import express from "express";
import dotenv from "dotenv";
import connectDb from "./Database/Mongo_Database.js";
import login_signup_router from "./Authentication/Signup_Login.js";
import analyse_router from "./Plant_Analyse/Plant_Analyse_APIs.js";

dotenv.config();
const app = express();
app.use(express.json());
connectDb();

app.use("/" , login_signup_router);
app.use("/detect" , analyse_router);

app.listen(4000, () => {
  console.log("🚀 Composite API with Auth running on port 4000");
});
