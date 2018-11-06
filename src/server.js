import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import socketIo from 'socket.io';
import handleIoConnection from './handleIoConnection';

const app = express();
app.use(express.static('public'));

const server = process.env.HTTPS ? https.createServer({
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
}, app) : http.Server(app);

const io = socketIo(server);

io.on('connection', handleIoConnection);

const port = process.env.PORT || 3333;
server.listen(port, () => console.log(`Listening on port ${port}`));
