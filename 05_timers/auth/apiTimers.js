const express = require("express");
const { nanoid } = require("nanoid");

const router = express.Router();

const DB = {
  timers: [
    {
      start: Date.now(),
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
  ],
};

router.get("/", (req, res) => {
  DB.timers.forEach((el) => {
    if (el.isActive) {
      el.progress = new Date() - el.start;
    }
  });
  res.json(DB.timers.filter((el) => el.isActive === JSON.parse(req.query.isActive)));
});

router.post("/", (req, res) => {
  DB.timers.push({
    start: Date.now(),
    description: req.body.description,
    isActive: true,
    id: nanoid(),
  });

  res.json(DB.timers.slice(-1)[0]);
});

router.post("/:id/stop", (req, res) => {
  const timer = DB.timers.find(function (el) {
    return el.id === req.params.id;
  });
  timer.isActive = false;
  timer.end = new Date();
  timer.duration = timer.end - timer.start;

  res.sendStatus(204);
});

module.exports = router;
