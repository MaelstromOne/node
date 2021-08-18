const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");
const crypto = require("crypto");

const app = express();

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
app.use("/api/timers", require("./apiTimers"));

const auth = () => (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  const user = findUserBySession(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const hash = (d) => crypto.createHash("sha256").update(d).digest("hex");

const DB = {
  users: [
    {
      _id: nanoid(),
      username: "admin",
      password: hash("pwd007"),
    },
  ],
  sessions: {},
};

const findUserByName = (username) => {
  return DB.users.find((user) => {
    return user.username === username;
  });
};

const findUserBySession = (sessionId) => {
  return DB.users.find((user) => user._id === DB.sessions[sessionId]);
};

const createSession = (userId) => {
  const sessionId = nanoid();
  DB.sessions[sessionId] = userId;
  return sessionId;
};

const deleteSession = (sessionId) => {
  delete DB.sessions[sessionId];
};

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = findUserByName(username);
  if (!user || user.password !== hash(password)) {
    return res.redirect("/?authError=true");
  }

  const sessionId = createSession(user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  DB.users.push({
    _id: nanoid(),
    username: username,
    password: hash(password),
  });

  res.redirect(`/?user=${username}`);
});

app.get("/logout", auth(), (req, res) => {
  if (!req.user) return res.redirect("/");

  deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
