const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

module.exports = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      if (!socket.user) return next(new Error('User not found'));
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.name}`);

    // Update user status
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });
    onlineUsers.set(userId, socket.id);

    // Broadcast online status
    socket.broadcast.emit('userOnline', userId);

    // Join chat rooms
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
    });

    // Typing
    socket.on('typing', ({ chatId, userName }) => {
      socket.to(chatId).emit('typing', { chatId, userName });
    });

    socket.on('stopTyping', (chatId) => {
      socket.to(chatId).emit('stopTyping', chatId);
    });

    // Message read
    socket.on('messageRead', async ({ chatId, messageIds }) => {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: { user: userId } } }
      );
      socket.to(chatId).emit('messagesRead', { chatId, userId, messageIds });
    });

    // Message delivered
    socket.on('messageDelivered', async ({ messageId }) => {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deliveredTo: { user: userId } } },
        { new: true }
      );
      if (message) {
        socket.to(message.chat.toString()).emit('messageDelivered', { messageId, userId });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name}`);
      
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null
      });
      
      onlineUsers.delete(userId);
      socket.broadcast.emit('userOffline', { userId, lastSeen: new Date() });
    });
  });
};