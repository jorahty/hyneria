const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const httpserver = http.Server(app);

const clientDirectory = path.join(__dirname, 'client');

app.use(express.static(clientDirectory)); // Serve folder to client

httpserver.listen(3000);