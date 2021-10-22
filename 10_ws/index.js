const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const { auth } = require("./utils/middleware");
const ws = require("ws");
const { findUserBySessionId } = require("./utils/db");
const { createTimer, getTimers, findTimerById, updateTimer } = require("./utils/db");

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
app.use(auth);

app.use("/", require("./routes/root"));
app.use("/api/timers", require("./routes/api"));

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

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

server.on("upgrade", async (req, socket, head) => {
  const cookies = req.headers["cookie"] && cookie.parse(req.headers["cookie"]);
  const sessionId = cookies && cookies["sessionId"];
  const user = sessionId && (await findUserBySessionId(sessionId));

  if (!user) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(req, socket, head, (socket) => {
    req.user = user;
    wsServer.emit("connection", socket, req);
  });
});
