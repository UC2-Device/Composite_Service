import express from "express";
import { User } from "../Database/Mongo_Database.js";
import Razorpay from "razorpay";
import authMiddleware from "../Authentication/Authentication_Middleware.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEYID,  // replace with your test key
    key_secret: process.env.RAZOR_PAY_KEYSECRET,       // replace with your test secret
});

router.post("/prenium", authMiddleware, async (req, res) => {

    try {

        const user = await User.findOne({ device_id: req.user.device_id });
        if (!user) { res.status(500).json({ message: "user not found" }) };

        let amount = await user.total_sessions * 10;
        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            payment_capture: 1,
        });

        res.json({ orderId: order.id, key: process.env.RAZOR_PAY_KEYID });
    } catch (error) {
        res.status(500).json({ error: error });
    }
});


router.post("/sessions", authMiddleware, async (req, res) => {

    try {
        const user = await User.findOne({ device_id: req.user.device_id });
        if (!user) { res.status(500).json({ message: "user not found" }) };

        let tamount = user.total_sessions + req.body.amount;
        const cost = user.plan == "normal" ? 100 : 10000;
        tamount *= cost;
        console.log(tamount)
        const order = await razorpay.orders.create({
            amount: tamount,
            currency: "INR",
            payment_capture: 1,
        });

        res.json({ orderId: order.id, key: process.env.RAZOR_PAY_KEYID });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
    }
})

router.post("/plan", authMiddleware, async (req, res) => {

    try {
        const user = await User.findOne({ device_id: req.user.device_id });
        if (!user) { res.status(500).json({ message: "user not found" }) };
        console.log(req.body.isprenium)
        let amount = req.body.amount;
        const cost = req.body.isprenium == "normal" ? 100 : 1000;
        amount *= cost;
        console.log(amount);
        const order = await razorpay.orders.create({
            amount : amount,
            currency: "INR",
            payment_capture: 1,
        });

        res.json({ orderId: order.id, key: process.env.RAZOR_PAY_KEYID });
    } catch (error) {
        res.status(500).json({ error: error });
    }
})


router.post("/verify", authMiddleware, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, type, amount, isprenium } = req.body;
    console.log(type)
    // TODO: verify signature with crypto
    if (type === "planUpgrade") {

        const user = await User.findOne({ device_id: req.user.device_id });
        user.plan = "prenium";
        await user.save();

    }
    else if (type === "sessionUpgrade") {
        const user = await User.findOne({ device_id: req.user.device_id });
        user.total_sessions += amount;
        await user.save();
    }

    else if (type == "planPurchase") {
        try {
            console.log(isprenium)
            const plan = isprenium == "normal" ? "normal" : "prenium";
            const session = amount;
            const now = new Date();
            now.setDate(now.getDate() + 30);

            const user = await User.findOne({ device_id: req.user.device_id });
            if(!user)console.log("not found");
            user.total_sessions = session;
            user.plan = plan;
            user.subscription_end = now;
            console.log(user)
            await user.save();
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error });
        }
    }

    res.json({ success: true });
});

export default router;