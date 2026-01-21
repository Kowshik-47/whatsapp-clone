const router = require('express').Router();
const {
  accessChat,
  getChats,
  createGroup,
  updateGroup,
  addToGroup,
  removeFromGroup,
  deleteChat
} = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/').get(getChats).post(accessChat);
router.post('/group', createGroup);
router.route('/group/:id')
  .put(updateGroup)
  .delete(deleteChat);
router.put('/group/:id/add', addToGroup);
router.put('/group/:id/remove', removeFromGroup);

module.exports = router;