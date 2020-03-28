const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

mongoose.connect(
  "mongodb+srv://chris:123@problems-v8zh4.mongodb.net/problems?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/v1", require("./routes/problem"));

const io = socketIO();
const editorSocketService = require("./service/editorSocketService")(io);
const server = http.createServer(app);
io.attach(server);

app.use((req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "../public") });
});

server.listen(3000);

server.once("listening", onListening);

function onListening() {
  console.log("App listening on port 3000");
}
