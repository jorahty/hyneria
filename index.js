const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require("socket.io");
const THREE = require("three");

const app = express();
const httpserver = http.Server(app);
const io = socketio(httpserver);
const clientDirectory = path.join(__dirname, 'client');
app.use(express.static(clientDirectory));
const port = process.env.PORT || 3000;
httpserver.listen(port);

const BROADCAST_RATE = 30;
const TICK_RATE = 30;

// globals
let gamestate = {};
let controls = {};

io.on('connection', socket => {

  // add user to gamestate
  gamestate[socket.id] = {
    p: [-3 + Math.random() * 6, -3 + Math.random() * 6, -3 + Math.random() * 6],
    r: [0, 0]
  };

  // track user controls
  controls[socket.id] = {
    translate: false,
    rotate: ''
  }

  // listen for user input
  socket.on('input', code => {
    switch (code) {
    case 'go': controls[socket.id].translate = true; break;
    case 'stop': controls[socket.id].translate = false; break;
    default: controls[socket.id].rotate = code; break;
    }
  });

  // listen for disconnection
  socket.on('disconnect', () => {
    delete gamestate[socket.id];
    delete controls[socket.id];
  });
});

// emit regular updates to all clients
setInterval(() => { io.volatile.emit('update', gamestate); }, 1000 / BROADCAST_RATE);

// step/simulate the gamestate forward in time (based on input)
setInterval(Tick, 1000 / TICK_RATE);
function Tick() {
  for (let id in gamestate) { // for every user

    if (controls[id].rotate.includes('w')) {
      gamestate[id].r[1] = Math.min(gamestate[id].r[1] + 0.1, Math.PI / 2 - 0.1);
    }

    if (controls[id].rotate.includes('s')) {
      gamestate[id].r[1] = Math.max(gamestate[id].r[1] - 0.1, -Math.PI / 2 + 0.1);
    }

    if (controls[id].rotate.includes('a')) {
      gamestate[id].r[0] += 0.1;
    }

    if (controls[id].rotate.includes('d')) {
      gamestate[id].r[0] -= 0.1;
    }


  }
}