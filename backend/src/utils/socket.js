const socketIo = require('socket.io');

let io;

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected via socket.io:', socket.id);

    // Clients can join a room based on the jobId so they only get updates for the job they are viewing
    socket.on('join_job_room', (jobId) => {
      socket.join(jobId);
      console.log(`Socket ${socket.id} joined job room: ${jobId}`);
    });

    socket.on('leave_job_room', (jobId) => {
      socket.leave(jobId);
      console.log(`Socket ${socket.id} left job room: ${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIo };
