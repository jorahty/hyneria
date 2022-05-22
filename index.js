const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require("socket.io");
const THREE = require("three");

const app = express();
const httpserver = http.Server(app);
const io = socketio(httpserver);
const clientDirectory = path.join(__dirname, 'client');
app.use(express.static(clientDirectory)); // Serve client folder
const port = process.env.PORT || 3000;
httpserver.listen(port);

let scene = new THREE.Scene();

io.on('connection', socket => {

  console.log('socket.id', socket.id);

});