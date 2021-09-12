const express = require("express");
const { createTimer, getTimers, findTimerById, updateTimer } = require("../utils/db");

const router = express.Router();

router.get("/", async (req, res) => {
  const timers = await getTimers((await req.user).id, req.query.isActive);
  if (req.query.isActive) {
    timers.forEach((el) => {
      el.progress = new Date() - el.start;
    });
  }

  res.json(timers);
});

router.post("/", async (req, res) => {
  const id = await createTimer((await req.user).id, req.body.description);
  res.json({ id });
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
