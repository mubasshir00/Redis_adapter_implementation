const express = require("express"); //requires express module
const socket = require("socket.io"); //requires socket.io module
const fs = require("fs");
const cors = require("cors");
const app = express();
const redis = require("redis");
const path = require("path");

const https = require("https");
const config = require("config");
const moment = require("moment");
const { redisClient } = require("./library/redis_connect");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { Emitter } = require("@socket.io/redis-emitter");
const redisAdapter = require("socket.io-redis");
// let redisClient = redis.createClient(
//   config.get(`redis.port`),
//   config.get(`redis.host`),
// );
// env == "test" ? redisClient.auth(config.get(`redis.password`)) : "";
// redisClient.auth(config.get(`redis.password`));
const httpPort = 5556;
const httpsPort = 444;

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

const publicDirectoryPath = path.join(__dirname, "/public");
app.use(express.static(publicDirectoryPath));

const credentials = {
  key: fs.readFileSync("ssl/private.key"),
  cert: fs.readFileSync("ssl/bundle.crt"),
  requestCert: true,
  rejectUnauthorized: false,
};

// app.use(cors());

const port = httpsPort;
var server = https.createServer(credentials, app);
var con = server.listen(port, () => {
  console.log(`socket server listening on ${port}`);
});

/* var PORT = process.env.PORT || 5555;
const server = app.listen(PORT); //hosts server on localhost:3000 */

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.send("HELLO FROM POCO SOCKET SERVER!");
});

app.use(cors());

console.log("Socket IO is running!");
const io = socket(con, {
  cors: {
    origin: "*",
  },
});

io.adapter(createAdapter(pubClient, subClient));
// console.log({redisClient});
// function leaderboard_set(socket) {
//   // console.log({ socket });

//   subClient.zadd("test", "223", "1");

//   pubClient.zrevrange("test", "0", "-1", "WITHSCORES", (err, data) => {
//     data.map((x) => {
//       console.log(x);
//       socket.emit("leaderboard", {
//         all: x,
//       });
//     });
//   });
// }

// console.log({redisClient});

const emitter = new Emitter(redisClient);

//  setInterval(()=>{
//     console.log("hello");
//     // console.log({emitter});
//     emitter.emit("time", new Date());
//  },5000)

async function leaderboard_get(socket) {
  // console.log({subClient});
  // console.log({redisClient});
  //  console.log({emitter});
  // redisClient.connect()

  // console.log({emitter});

  // await redisClient.zrevrange("host_leaderboard_lifetime", 0, -1, "WITHSCORES",(err,reply)=>{
  //     socket.emit("leaderboard", reply);
  // });


  pubClient.subscribe(
    "hellllo",
    redisClient.zrevrange(
      "host_leaderboard_lifetime",
      0,
      -1,
      "WITHSCORES",
      (err, reply) => {
        socket.emit("leaderboard", reply);
      }
    )
  );

  // await subClient.zrevrange(
  //   "host_leaderboard_lifetime",
  //   0,
  //   -1,
  //   "WITHSCORES",
  //   (err, reply) => {
  //     console.log("something wrong");
  //     socket.emit("leaderboard", reply);
  //   }
  // );

  // socket.emit("leaderboard","hello");
}

// console.log({ io });

//Socket.io Connection------------------
io.on("connection", socket => {
  console.log("New socket connection: " + socket.id);
  // console.log({pubClient});

  // leaderboard_get(socket)

  //    socket.emit("leaderboard", leaderboard_get(socket));

  //  subClient.subscribe("leaderboard_data",redisClient.zincrby("host_leaderboard_lifetime",212,1143));

  // pubClient.publish(
  //   "leaderboard_data",
  //   redisClient.zrevrange(
  //     "host_leaderboard_lifetime",
  //     0,
  //     -1,
  //     "WITHSCORES",
  //     (err, reply) => {
  //       socket.emit("leaderboard_data", reply);
  //     }
  //   )
  // );

  socket.on("leaderboard_rtm",(data)=>{
    console.log({data});
    socket.broadcast.emit("hello",data)
    data = JSON.parse(data);
    console.log({data});
    subClient.subscribe(
      "leaderboard_data",
      redisClient.zincrby("host_leaderboard_lifetime",data.score,data.member_id)
    );

    pubClient.publish(
      "leaderboard_data",
      redisClient.zrevrange(
        "host_leaderboard_lifetime",
        0,
        -1,
        "WITHSCORES",
        (err, reply) => {
          socket.emit("leaderboard_data", reply);
        }
      )
    );
  })

  socket.on("onMessage", data => {
    console.log({ data });
    // pubClient.publish(
    //   "leaderboard_data",
    //   redisClient.zrevrange(
    //     "host_leaderboard_lifetime",
    //     0,
    //     -1,
    //     "WITHSCORES",
    //     (err, reply) => {
    //       socket.emit("leaderboard_data", reply);
    //     }
    //   )
    // );
    socket.broadcast.emit("onMessageReceived", data);
  });

  socket.on("disconnect", function () {
    console.log("disconnected: " + socket.id);
  });
});
