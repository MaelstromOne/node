const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const { auth } = require("./utils/middleware");

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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
