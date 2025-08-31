import sessions from "./Session_Data";

export function sessionAuth(req, res, next) {
  const sessionId = req.headers["session_id"]; // expect session id in headers

  if (!sessionId) {
    return res.status(401).json({ error: "Session ID required in headers (session_id)" });
  }

  const session = sessions[sessionId];
  if (!session) {
    return res.status(403).json({ error: "Invalid or expired session ID" });
  }

  if (session.remaining_calls <= 0) {
    delete session[sessionId];
    return res.status(403).json({ error: "Session call limit reached" });
  }

  // ✅ Attach session to request so routes can use it
  req.session = session;
  req.sessionId = sessionId;

  next();
}
