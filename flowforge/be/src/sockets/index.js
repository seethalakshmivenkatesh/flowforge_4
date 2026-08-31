let ioInstance = null;

// Map of userId -> Set of socket ids, so we can push events to a specific user
const userSockets = new Map();

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;

    if (userId) {
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
      socket.join(`user:${userId}`);
    }

    socket.on('joinProject', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on('leaveProject', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) userSockets.delete(userId);
      }
    });
  });
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO not initialized yet');
  return ioInstance;
}

function emitToProject(projectId, event, payload) {
  if (!ioInstance || !projectId) return;
  ioInstance.to(`project:${projectId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToProject, emitToUser };
