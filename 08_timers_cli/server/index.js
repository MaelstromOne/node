const express = require("express");
const cookieParser = require("cookie-parser");
const { auth } = require("./utils/middleware");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(auth);

app.use("/", require("./routes/root"));
app.use("/api/timers", require("./routes/api"));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
