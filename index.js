const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require("socket.io");
const { Point, Cube, OcTree } = require('./octree.js');

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

// plankton
let bin = new Cube(0, 0, 0, 40);
let plankton = new OcTree(bin, 4);
for (let i = 0; i < 150; i++) {
  let p = new Point(random(-40, 40), random(-40, 40), random(-40, 40));
  plankton.insert(p);
}

io.on('connection', socket => {

  const playerId = ++playerCount;

  io.to(socket.id).emit('id', playerId);

  io.emit('plankton', plankton.query(bin));

  // add user to gamestate
  gamestate[playerId] = {
    p: [random(-3, 3), random(-3, 3), random(-3, 3)],
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
      gamestate[id].r[0] = (gamestate[id].r[0] + ROTATE_SPEED) % (Math.PI * 2);
    }

    if (controls[id].rotate.includes('d')) {
      gamestate[id].r[0] = (gamestate[id].r[0] - ROTATE_SPEED) % (Math.PI * 2);
    }

    if (controls[id].rotate != '') {
      // round to nearest tenth
      gamestate[id].r[0] = round(gamestate[id].r[0]);
      gamestate[id].r[1] = round(gamestate[id].r[1]);
    }

    // translate
    if (controls[id].translate) {
      let phi = gamestate[id].r[0];
      let theta = gamestate[id].r[1] + Math.PI / 2;
      gamestate[id].p[0] -= TRANSLATE_SPEED * Math.sin(phi) * Math.sin(theta);
      gamestate[id].p[1] -= TRANSLATE_SPEED * Math.cos(theta);
      gamestate[id].p[2] -= TRANSLATE_SPEED * Math.cos(phi) * Math.sin(theta);

      // round to nearest tenth
      gamestate[id].p[0] = round(gamestate[id].p[0]);
      gamestate[id].p[1] = round(gamestate[id].p[1]);
      gamestate[id].p[2] = round(gamestate[id].p[2]);
    }
  }
}

function random(a, b) {
  let x = a + Math.random() * (b - a);
  return round(x);

}

function round(x) {
  return Math.round(x * 100) / 100;
}