const router = require('express').Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  starMessage,
  uploadFile
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', deleteMessage);
router.put('/:id/star', starMessage);

module.exports = router;