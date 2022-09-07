const express = require('express'); //requires express module
const socket = require('socket.io'); //requires socket.io module
const fs = require('fs');
const cors = require('cors');
const app = express();
const redis = require('redis');
const https = require('https');
const config = require('config');
const moment = require('moment');
// const { redisClient } = require('./library/redis_connect');
const redisClient = redis.createClient({
  port: "6379",
  host: "127.0.0.1",
});
const { createAdapter } = require('@socket.io/redis-adapter');
const { Emitter } = require('@socket.io/redis-emitter');

const httpPort = 5556;
const httpsPort = 444;

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

// console.log({pubClient});
// console.log({ subClient });

// let credentials = {
//     key: fs.readFileSync('ssl/new/new_private.key'),
//     cert: fs.readFileSync('ssl/new/new__elivehive_com.crt'),
//     ca: fs.readFileSync('ssl/new/new__elivehive_com.ca-bundle')
// };

const credentials = {
    key: fs.readFileSync('ssl/private.key'),
    cert: fs.readFileSync('ssl/bundle.crt'),
    requestCert: true,
    rejectUnauthorized: false,
};

// app.use(cors());

const port = httpsPort;
var server = https.createServer(credentials, app);
var con = server.listen(port, () => { console.log(`socket server listening on ${port}`) });

/* var PORT = process.env.PORT || 5555;
const server = app.listen(PORT); //hosts server on localhost:3000 */

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('HELLO FROM POCO SOCKET SERVER!');
})

console.log('Socket IO is running!');
const io = socket(con, {
    cors: {
        origin: "*"
    }
});

io.adapter(createAdapter(pubClient,subClient));

const emitter = new Emitter(redisClient);

// setInterval(() => {
//   emitter.emit("time", new Date());
// }, 5000);

 function leaderboard_get(){

    // return "HELLO"

    return pubClient.zrevrange(
      "host_leaderboard_lifetime",
      "0",
      "-1",
      "WITHSCORES",
      (err, data) => {
        data.map(x => {
          console.log(x);
        });
      }
    );
    // socket.adapter.emit("hello","world");
    // pubClient.zrevrange(
    //   "host_leaderboard_lifetime",
    //   "0",
    //   "-1",
    //   "WITHSCORES",
    //   (err, data) => {
    //     if (err) {
    //       return err;
    //     }
    //   }
    // );
}


// function leaderboard_set(socket) {
//   // console.log({ socket });

//   subClient.zadd("test", "223", "1");

//   pubClient.zrevrange("test", "0", "-1", "WITHSCORES", (err, data) => {
//     data.map(x => {
//       console.log(x);
//       socket.emit("leaderboard", {
//         all: x,
//       });
//     });
//   });
// }

console.log(pubClient);




//Socket.io Connection------------------
io.on('connection', (socket) => {
   
    // leaderboard_set(socket);
    // leaderboard_get();

   socket.emit("leaderboard",leaderboard_get());

    socket.on('onMessage', (data) => {
        console.log({ data });
        socket.broadcast.emit('onMessageReceived', data);
    })

    socket.on('disconnect', function () {
        console.log('disconnected: ' + socket.id);
    });

    
})
