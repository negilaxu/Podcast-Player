const express = require("express");
const app = express();

app.get("/", function (req, res) {
  res.send("hello user!");
});

app.listen(3000);
