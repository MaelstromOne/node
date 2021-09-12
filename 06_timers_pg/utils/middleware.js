const { findUserBySessionId } = require("../utils/db");

const auth = (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

module.exports = { auth };
