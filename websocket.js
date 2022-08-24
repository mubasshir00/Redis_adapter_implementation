const express = require('express'); //requires express module
const socket = require('socket.io'); //requires socket.io module
const fs = require('fs');
const cors = require('cors');
const app = express();

const https = require('https');

const httpPort = 5556;
const httpsPort = 444;

// let credentials = {
//     key: fs.readFileSync('ssl/new/new_private.key'),
//     cert: fs.readFileSync('ssl/new/new__elivehive_com.crt'),
//     ca: fs.readFileSync('ssl/new/new__elivehive_com.ca-bundle')
// };


// app.use(cors());

const port = httpsPort;
var server = https.createServer(app);
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

//Socket.io Connection------------------
io.on('connection', (socket) => {
    console.log("New socket connection: " + socket.id);
    socket.on('onMessage', (data) => {
        console.log({ data });
        socket.broadcast.emit('onMessageReceived', data);
    })

    socket.on('disconnect', function () {
        console.log('disconnected: ' + socket.id);
    });
})