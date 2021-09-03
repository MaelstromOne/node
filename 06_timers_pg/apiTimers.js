const express = require("express");
const { client, connection } = require("./knexfile");

const router = express.Router();
const knex = require("knex")({
  client,
  connection,
});

const createTimer = (user_id, description) => {
  return knex("timers")
    .insert({
      user_id,
      start: new Date().toISOString(),
      description: description,
      is_active: true,
    })
    .returning("id");
};

const getTimers = (user_id, isActive) => {
  return knex("timers").select().where({ user_id, is_active: isActive });
};

const findTimerById = (id) => {
  return knex("timers")
    .select()
    .where({ id })
    .limit(1)
    .then((results) => results[0]);
};

const updateTimer = async (timer) => {
  await knex("timers")
    .update({
      is_active: timer.is_active,
      duration: timer.duration,
      end: timer.end,
    })
    .where({ id: timer.id });
};

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
