const express = require("express");
const app = express();
const PORT = 5000;
const http = require("http");
const socketio = require("socket.io");

const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const client = redis.createClient({
  port: "6379",
  host: "127.0.0.1",
});

const pubClient = client.duplicate();
const subClient = client.duplicate();

const server = http.createServer(app);
const io = socketio(server);

io.adapter(createAdapter(pubClient, subClient));

function sendMessage(socket) {
  console.log({ socket });
  client.lrange("messages", "0", "-1", (err, data) => {
    data.map(x => {
      const usernameMessage = x.split(":");
      const redisUsername = usernameMessage[0];
      const redisMessage = usernameMessage[1];

      socket.emit("message", {
        from: redisUsername,
        message: redisMessage,
      });
    });
  });
}

function leaderboard_set(socket) {
  // console.log({ socket });

  subClient.zadd("test","223","1")

  pubClient.zrevrange("test", "0", "-1", "WITHSCORES", (err, data) => {
    data.map(x => {
      console.log(x);
      socket.emit("leaderboard",{
        "all" : x
      })
    });
  });
}



io.on("connection", socket => {
  leaderboard_set(socket);
  console.log(subClient);
  // console.log({pubClient});
  // sendMessage(socket);

  // socket.on("message", ({ message, from }) => {
  //     client.rpush("messages", `${from}:${message}`);

  //     io.emit("message", { from, message });
  // });
});

app.get("/chat", (req, res) => {
  const username = req.query.username;

  io.emit("joined", username);
  res.render("chat", { username });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(PORT, () => {
  console.log(`Server at ${PORT}`);
});
