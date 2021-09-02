const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");
const crypto = require("crypto");
const { client, connection } = require("./knexfile");

const app = express();
const knex = require("knex")({
  client,
  connection,
});

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
});
app.use("/api/timers", require("./apiTimers"));

const hash = (d) => crypto.createHash("sha256").update(d).digest("hex");

const createUser = async (username, password) => {
  await knex("users").insert({
    username: username,
    password: hash(password),
  });
};

const findUserByName = (username) => {
  return knex("users")
    .select()
    .where({ username })
    .limit(1)
    .then((results) => results[0]);
};

const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions")
    .select("user_id")
    .where({ session_id: sessionId })
    .limit(1)
    .then((results) => results[0]);

  if (!session) {
    return;
  }

  return knex("users")
    .select("id")
    .where({ id: session.user_id })
    .limit(1)
    .then((results) => results[0]);
};

const createSession = async (userId) => {
  const sessionId = nanoid();
  await knex("sessions").insert({
    user_id: userId,
    session_id: sessionId,
  });
  return sessionId;
};

const deleteSession = async (sessionId) => {
  await knex("sessions").where({ session_id: sessionId }).delete();
};

app.get("/", async (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signupError: req.query.signupError === "true" ? "A user with the same name already exists" : req.query.signupError,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (!user || user.password !== hash(password)) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(username);
  if (user !== undefined) {
    return res.redirect("/?signupError=true");
  }
  await createUser(username, password);

  res.redirect(`/?user=${username}`);
});

app.get("/logout", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
