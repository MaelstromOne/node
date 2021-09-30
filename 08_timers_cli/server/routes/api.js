const express = require("express");
const bodyParser = require("body-parser");
const { createTimer, getTimers, findTimerById, updateTimer } = require("../utils/db");

const router = express.Router();

router.get("/", async (req, res) => {
  const timers = await getTimers(req.user.id, req.query.isActive);
  if (req.query.isActive) {
    timers.forEach((el) => {
      el.progress = new Date() - el.start;
    });
  }
  res.json(timers);
});

router.post("/", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const id = await createTimer(req.user.id, req.body.description);
  res.json({ id });
});

router.get("/:id", async (req, res) => {
  const timer = await findTimerById(req.params.id);
  timer.duration = new Date() - timer.start;
  res.json(timer);
});

router.post("/:id/stop", async (req, res) => {
  const timer = await findTimerById(req.params.id);
  const end = new Date();

  timer.is_active = false;
  timer.end = end.toISOString();
  timer.duration = end - timer.start;
  timer.start = timer.start.toISOString();

  await updateTimer(timer);

  res.sendStatus(204);
});

module.exports = router;
