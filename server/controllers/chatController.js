const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

// Access or Create Private Chat
exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    let chat = await Chat.findOne({
      isGroup: false,
      users: { $all: [req.user._id, userId] }
    })
    .populate('users', 'name phone avatar isOnline lastSeen')
    .populate('lastMessage');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      users: [req.user._id, userId],
      isGroup: false
    });

    chat = await Chat.findById(chat._id)
      .populate('users', 'name phone avatar isOnline lastSeen');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Chats
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate('users', 'name phone avatar isOnline lastSeen')
      .populate('admin', 'name')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort('-updatedAt');

    // Get unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id }
        });
        return { ...chat.toObject(), unreadCount };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Group
exports.createGroup = async (req, res) => {
  try {
    const { name, users, description } = req.body;

    if (users.length < 2) {
      return res.status(400).json({ message: 'At least 2 users required' });
    }

    const chat = await Chat.create({
      name,
      isGroup: true,
      users: [req.user._id, ...users],
      admin: req.user._id,
      description,
      groupImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25D366&color=fff&size=200`
    });

    const fullChat = await Chat.findById(chat._id)
      .populate('users', 'name phone avatar isOnline lastSeen')
      .populate('admin', 'name');

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Group
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, groupImage } = req.body;
    
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { name, description, groupImage },
      { new: true }
    )
    .populate('users', 'name phone avatar isOnline lastSeen')
    .populate('admin', 'name');

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add User to Group
exports.addToGroup = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { users: req.body.userId } },
      { new: true }
    )
    .populate('users', 'name phone avatar isOnline lastSeen')
    .populate('admin', 'name');

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove User from Group
exports.removeFromGroup = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $pull: { users: req.body.userId } },
      { new: true }
    )
    .populate('users', 'name phone avatar isOnline lastSeen')
    .populate('admin', 'name');

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Chat
exports.deleteChat = async (req, res) => {
  try {
    await Message.deleteMany({ chat: req.params.id });
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};