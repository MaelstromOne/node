const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const { auth } = require("./utils/middleware");
const ws = require("ws");

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

wsServer.on("connection", (socket) => {
  socket.on("message", (message) => console.log(message));
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});

server.on("upgrade", (request, socket /*head*/) => {
  // wsServer.handleUpgrade(request, socket, head, socket => {
  //   wsServer.emit('connection', socket, request);
  // });

  socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
  socket.destroy();
  return;
});
