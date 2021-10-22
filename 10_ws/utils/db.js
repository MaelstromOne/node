const { nanoid } = require("nanoid");
const { hash } = require("../utils/utils");

const { client, connection } = require("./knexfile");
const knex = require("knex")({
  client,
  connection,
});

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
    .select("id", "username")
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

module.exports = {
  createUser,
  findUserByName,
  findUserBySessionId,
  createSession,
  deleteSession,
  createTimer,
  getTimers,
  findTimerById,
  updateTimer,
};
