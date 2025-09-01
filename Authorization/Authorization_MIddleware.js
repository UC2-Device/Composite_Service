import sessions from "./Session_Data.js";
import { User } from "../Database/Mongo_Database.js";

async function sessionAuth(req, res, next) {

  const sessionId = req.headers["session_id"]; // expect session id in headers

  if (!sessionId) {
    return res.status(401).json({ error: "Session ID required in headers (session_id)" });
  }

  const session = sessions[sessionId];
  if (!session) {
    const user = await User.findOne({ device_id: session.device_id });
    user.status = "not active";
    await user.save();

    return res.status(403).json({ error: "Invalid or expired session ID" });
  }

  if (session.remaining_calls <= 0) {
    delete sessions[sessionId];
    return res.status(403).json({ error: "Session call limit reached" });
  }

  // ✅ Attach session to request so routes can use it
  sessions[sessionId].remaining_calls = session.remaining_calls -1 ;

  req.session = session;
  req.sessionId = sessionId;

  next();
}

export default sessionAuth;