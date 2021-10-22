const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const { auth } = require("./utils/middleware");
const { findUserBySessionId } = require("./utils/db");
const wsServer = require("./routes/websocket");

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
