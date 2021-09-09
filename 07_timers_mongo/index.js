const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");
const crypto = require("crypto");
require("dotenv").config();

const { MongoClient, ObjectId } = require("mongodb");

const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  // poolSize: 10
});

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
app.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("timers");
    next();
  } catch (err) {
    next(err);
  }
});
app.use(async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  req.user = await findUserBySessionId(req.db, req.cookies["sessionId"]);
  req.sessionId = req.cookies["sessionId"];
  next();
});
app.use("/api/timers", require("./apiTimers"));

const hash = (d) => crypto.createHash("sha256").update(d).digest("hex");

const createUser = async (db, username, password) => {
  await db.collection("users").insertOne({
    username: username,
    password: hash(password),
  });
};

const findUserByName = (db, username) => {
  try {
    return db.collection("users").findOne({ username });
  } catch {
    return;
  }
};

const findUserBySessionId = async (db, sessionId) => {
  const session = await db.collection("sessions").findOne(
    {
      sessionId,
    },
    {
      projection: {
        userId: 1,
      },
    }
  );

  if (!session) {
    return;
  }

  return db.collection("users").findOne({
    _id: ObjectId(session.userId),
  });
};

const createSession = async (db, userId) => {
  const sessionId = nanoid();
  await db.collection("sessions").insertOne({
    userId,
    sessionId,
  });

  return sessionId;
};

const deleteSession = async (db, sessionId) => {
  await db.collection("sessions").deleteOne({ sessionId });
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
  const user = await findUserByName(req.db, username);
  if (!user || user.password !== hash(password)) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await createSession(req.db, user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByName(req.db, username);
  if (user) {
    return res.redirect("/?signupError=true");
  }
  await createUser(req.db, username, password);

  res.redirect(`/?user=${username}`);
});

app.get("/logout", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await deleteSession(req.db, req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
