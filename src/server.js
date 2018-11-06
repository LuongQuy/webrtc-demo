import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import socketIo from 'socket.io';

const app = express();
app.use(express.static('public'));

const server = process.env.HTTPS ? https.createServer({
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
}, app) : http.Server(app);

const io = socketIo(server);

io.on('connection', socket => {
  socket.on('join', room => {
    const sockets = io.sockets.adapter.rooms[room];
    if (!sockets || !sockets.length) {
      socket.join(room);
      socket.emit('created');
    } else if (sockets.length === 1) {
      socket.join(room);
      socket.emit('joined');
    } else {
      socket.emit('full');
    }
  });

  socket.on('ready', room => {
    socket.broadcast.to(room).emit('ready');
  });
  socket.on('offer', ({ room, sdp }) => {
    socket.broadcast.to(room).emit('offer', sdp);
  });
  socket.on('answer', ({ room, sdp }) => {
    socket.broadcast.to(room).emit('answer', sdp);
  });
  socket.on('icecandidate', ({ room, candidate }) => {
    socket.broadcast.to(room).emit('icecandidate', candidate);
  });
});

const port = process.env.PORT || 3333;
server.listen(port, () => console.log(`Listening on port ${port}`));
