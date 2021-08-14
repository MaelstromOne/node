const express = require("express");
const nunjucks = require("nunjucks");
const { nanoid } = require("nanoid");

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

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/api/timers", (req, res) => {
  TIMERS.forEach((el) => {
    if (el.isActive) {
      el.progress = new Date() - el.start;
    }
  });
  res.json(TIMERS.filter((el) => el.isActive === JSON.parse(req.query.isActive)));
});

app.post("/api/timers", (req, res) => {
  TIMERS.push({
    start: Date.now(),
    description: req.body.description,
    isActive: true,
    id: nanoid(),
  });

  res.json(TIMERS.slice(-1)[0]);
});

app.post("/api/timers/:id/stop", (req, res) => {
  const timer = TIMERS.find(function (el) {
    return el.id === req.params.id;
  });
  timer.isActive = false;
  timer.end = new Date();
  timer.duration = timer.end - timer.start;

  res.sendStatus(204);
});

// You can use these initial data
const TIMERS = [
  {
    start: Date.now(),
    end: Date.now() + 3000,
    description: "Timer 1",
    isActive: true,
    id: nanoid(),
  },
  {
    start: Date.now() - 5000,
    end: Date.now() - 3000,
    duration: 2000,
    description: "Timer 0",
    isActive: false,
    id: nanoid(),
  },
];

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
