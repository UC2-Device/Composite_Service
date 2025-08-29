import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

function authMiddleware(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const token = req.headers["authorization"]?.split(" ")[1]; // Expect "Bearer <token>"
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default authMiddleware ;