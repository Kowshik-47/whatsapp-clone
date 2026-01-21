const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Get Messages
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ chat: chatId, deleted: false })
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type',
        populate: { path: 'sender', select: 'name' }
      })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      { $push: { readBy: { user: req.user._id } } }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send Message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, type = 'text', file, replyTo } = req.body;

    let message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      type,
      file,
      replyTo,
      readBy: [{ user: req.user._id }],
      deliveredTo: [{ user: req.user._id }]
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    message = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type',
        populate: { path: 'sender', select: 'name' }
      });

    // Emit via socket
    const io = req.app.get('io');
    io.to(chatId).emit('newMessage', message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Message
exports.deleteMessage = async (req, res) => {
  try {
    const { forEveryone } = req.query;
    
    if (forEveryone === 'true') {
      await Message.findByIdAndUpdate(req.params.id, {
        deleted: true,
        content: 'This message was deleted'
      });
    } else {
      // Just mark as deleted for this user (could use a deletedFor array)
      await Message.findByIdAndDelete(req.params.id);
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Star Message
exports.starMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    const isStarred = message.starred.includes(req.user._id);

    await Message.findByIdAndUpdate(req.params.id, {
      [isStarred ? '$pull' : '$addToSet']: { starred: req.user._id }
    });

    res.json({ starred: !isStarred });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload File
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};