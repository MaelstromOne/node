const { findUserBySessionId } = require("../utils/db");

const auth = async (req, res, next) => {
  if (!req.headers.sessionid) {
    return next();
  }

  const user = await findUserBySessionId(req.headers.sessionid);
  req.user = user;
  req.sessionId = req.headers.sessionid;
  next();
};

module.exports = { auth };
