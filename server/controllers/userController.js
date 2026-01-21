const User = require('../models/User');

// Search Users
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).select('name phone avatar about isOnline lastSeen');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name phone avatar about isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, about, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, about, avatar },
      { new: true }
    );
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Contacts (Users)
exports.getContacts = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name phone avatar about isOnline lastSeen')
      .sort('name');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};