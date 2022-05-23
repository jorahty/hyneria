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
let scene = new THREE.Scene(); // to make use of translateX

io.on('connection', socket => {

  // add user to gamestate
  gamestate[socket.id] = {
    p: [-3 + Math.random() * 6, -3 + Math.random() * 6, -3 + Math.random() * 6],
    r: [0, -Math.PI / 2]
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
    // if (controls[id].isRotating) gamestate[id].rotation += ROTATE_SPEED;
    // if (controls[id].isTranslating) {
    //     gamestate[id].x -= TRANSLATE_SPEED * Math.sin(gamestate[id].rotation);
    //     gamestate[id].y += TRANSLATE_SPEED * Math.cos(gamestate[id].rotation);
    // }
    // gamestate[id].r[0] += 0.01;

    if (controls[id].rotate.includes('a')) {
      gamestate[id].r[0] += 0.1;
      return;
    }

    if (controls[id].rotate.includes('d')) {
      gamestate[id].r[0] -= 0.1;
    }


  }
}