const handleIoConnection = socket => {
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
};

export default handleIoConnection;
