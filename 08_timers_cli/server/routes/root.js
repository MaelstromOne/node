const express = require("express");
const bodyParser = require("body-parser");
const { hash } = require("../utils/utils");
const { createUser, findUserByName, createSession, deleteSession } = require("../utils/db");

const router = express.Router();

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (!user || user.password !== hash(password)) {
    return res.json({ error: "Wrong username or password!" });
  }

  const sessionId = await createSession(user.id);
  res.json({ sessionId });
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (user !== undefined) {
    return res.json({ error: "A user with the same name already exists" });
  }

  const userId = await createUser(username, password);
  const sessionId = await createSession(userId);
  res.json({ sessionId });
});

router.get("/logout", async (req, res) => {
  if (!req.user) return res.json({});

  await deleteSession(req.sessionId);
  res.json({});
});

module.exports = router;
