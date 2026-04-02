const express = require('express');
const router = express.Router();
const {
  getVisitors, getVisitor, createVisitor,
  updateVisitor, deleteVisitor,
  blacklistVisitor, unblacklistVisitor,
} = require('../controllers/visitorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `visitor-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(protect);

router.get('/', authorize('admin', 'security', 'employee'), getVisitors);
router.get('/:id', authorize('admin', 'security', 'employee'), getVisitor);
router.post('/', upload.single('photo'), createVisitor);
router.put('/:id', authorize('admin', 'security'), upload.single('photo'), updateVisitor);
router.delete('/:id', authorize('admin'), deleteVisitor);
router.patch('/:id/blacklist', authorize('admin'), blacklistVisitor);
router.patch('/:id/unblacklist', authorize('admin'), unblacklistVisitor);

module.exports = router;
