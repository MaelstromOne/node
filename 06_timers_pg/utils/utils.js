const crypto = require("crypto");

const hash = (d) => crypto.createHash("sha256").update(d).digest("hex");

module.exports = { hash };
