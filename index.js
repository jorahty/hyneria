const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require("socket.io");

const app = express();
const httpserver = http.Server(app);
const io = socketio(httpserver);
const clientDirectory = path.join(__dirname, 'client');
app.use(express.static(clientDirectory));
const port = process.env.PORT || 3000;
httpserver.listen(port);

const BROADCAST_RATE = 30;
const TICK_RATE = 30;
const TRANSLATE_SPEED = 0.12;
const ROTATE_SPEED = 0.07;

// globals
let gamestate = {};
let controls = {};
let playerCount = 0;

io.on('connection', socket => {

  const playerId = ++playerCount;

  io.to(socket.id).emit('id', playerId);

  // add user to gamestate
  let x = Math.round((-3 + Math.random() * 6) * 100) / 100;
  let y = Math.round((-3 + Math.random() * 6) * 100) / 100;
  let z = Math.round((-3 + Math.random() * 6) * 100) / 100;
  gamestate[playerId] = {
    p: [x, y, z],
    r: [0, 0]
  };

  // track user controls
  controls[playerId] = {
    translate: false,
    rotate: ''
  }

  // listen for user input
  socket.on('input', code => {
    switch (code) {
    case 'go': controls[playerId].translate = true; break;
    case 'stop': controls[playerId].translate = false; break;
    default: controls[playerId].rotate = code; break;
    }
  });

  // listen for disconnection
  socket.on('disconnect', () => {
    delete gamestate[playerId];
    delete controls[playerId];
  });
});

// emit regular updates to all clients
setInterval(() => { io.volatile.emit('update', gamestate); }, 1000 / BROADCAST_RATE);

// step/simulate the gamestate forward in time (based on controls)
setInterval(Tick, 1000 / TICK_RATE);
function Tick() {
  for (let id in gamestate) { // for every user

    // rotate
    if (controls[id].rotate.includes('w')) {
      gamestate[id].r[1] = Math.min(gamestate[id].r[1] + ROTATE_SPEED, Math.PI / 2 - 0.1);
    }

    if (controls[id].rotate.includes('s')) {
      gamestate[id].r[1] = Math.max(gamestate[id].r[1] - ROTATE_SPEED, -Math.PI / 2 + 0.1);
    }

    if (controls[id].rotate.includes('a')) {
      gamestate[id].r[0] += ROTATE_SPEED;
    }

    if (controls[id].rotate.includes('d')) {
      gamestate[id].r[0] -= ROTATE_SPEED;
    }

    if (controls[id].rotate != '') {
      // round to nearest tenth
      gamestate[id].r[0] = Math.round(gamestate[id].r[0] * 100) / 100;
      gamestate[id].r[1] = Math.round(gamestate[id].r[1] * 100) / 100;
    }

    // translate
    if (controls[id].translate) {
      let phi = gamestate[id].r[0];
      let theta = gamestate[id].r[1] + Math.PI / 2;
      gamestate[id].p[0] -= TRANSLATE_SPEED * Math.sin(phi) * Math.sin(theta);
      gamestate[id].p[1] -= TRANSLATE_SPEED * Math.cos(theta);
      gamestate[id].p[2] -= TRANSLATE_SPEED * Math.cos(phi) * Math.sin(theta);

      // round to nearest tenth
      gamestate[id].p[0] = Math.round(gamestate[id].p[0] * 100) / 100;
      gamestate[id].p[1] = Math.round(gamestate[id].p[1] * 100) / 100;
      gamestate[id].p[2] = Math.round(gamestate[id].p[2] * 100) / 100;
    }
  }
}