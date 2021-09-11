const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

const createTimer = (db, userId, description) => {
  return db.collection("timers").insertOne({
    userId,
    start: new Date(),
    description: description,
    isActive: true,
  });
};

const getTimers = (db, userId, isActive) => {
  return db.collection("timers").find({ userId, isActive }).toArray();
};

const findTimerById = (db, id) => {
  return db.collection("timers").findOne({ _id: ObjectId(id) });
};

const updateTimer = async (db, timer) => {
  await db.collection("timers").updateOne(
    {
      _id: timer._id,
    },
    {
      $set: {
        isActive: timer.isActive,
        duration: timer.duration,
        end: timer.end,
      },
    }
  );
};

router.get("/", async (req, res) => {
  const timers = await getTimers(req.db, req.user._id, req.query.isActive === "true");
  if (req.query.isActive) {
    timers.forEach((el) => {
      el.progress = new Date() - el.start;
    });
  }

  res.json(timers);
});

router.post("/", async (req, res) => {
  const id = await createTimer(req.db, req.user._id, req.body.description);
  res.json({ id: id.insertedId.toString() });
});

router.post("/:id/stop", async (req, res) => {
  const timer = await findTimerById(req.db, req.params.id);
  const end = new Date();

  timer.isActive = false;
  timer.end = end;
  timer.duration = end - timer.start;

  await updateTimer(req.db, timer);

  res.sendStatus(204);
});

module.exports = router;
