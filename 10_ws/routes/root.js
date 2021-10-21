const express = require("express");
const bodyParser = require("body-parser");
const { hash } = require("../utils/utils");
const { createUser, findUserByName, createSession, deleteSession } = require("../utils/db");

const router = express.Router();

router.get("/", async (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signupError: req.query.signupError === "true" ? "A user with the same name already exists" : req.query.signupError,
  });
});

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (!user || user.password !== hash(password)) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (user !== undefined) {
    return res.redirect("/?signupError=true");
  }
  await createUser(username, password);

  res.redirect(`/?user=${username}`);
});

router.get("/logout", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

module.exports = router;
