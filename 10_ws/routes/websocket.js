const ws = require("ws");
const { createTimer, getTimers, findTimerById, updateTimer } = require("../utils/db");

const wsServer = new ws.Server({ noServer: true });

wsServer.on("connection", (socket, req) => {
  socket.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log(e);
    }
    switch (data.type) {
      case "fetchTimers": {
        const timers = await getTimers(req.user.id, data.isActive);
        if (data.isActive) {
          timers.forEach((el) => {
            el.progress = new Date() - el.start;
          });
        }
        socket.send(
          JSON.stringify({
            type: data.isActive ? "activeTimers" : "oldTimers",
            timers,
          })
        );
        break;
      }
      case "createTimer": {
        const id = await createTimer(req.user.id, data.description);
        socket.send(
          JSON.stringify({
            type: "createTimer",
            id,
            description: data.description,
          })
        );
        break;
      }
      case "stopTimer": {
        const timer = await findTimerById(data.id);
        const end = new Date();
        timer.is_active = false;
        timer.end = end.toISOString();
        timer.duration = end - timer.start;
        timer.start = timer.start.toISOString();
        await updateTimer(timer);

        socket.send(
          JSON.stringify({
            type: "stopTimer",
            id: timer.id,
          })
        );
        break;
      }
    }
  });
});

module.exports = wsServer;
