const express = require('express');
const router = express.Router();
const {
  getPasses, getPassByQR, getPass,
  issuePass, revokePass, downloadPassPDF,
} = require('../controllers/passController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);

// ✅ visitor added so they can see their own passes
router.get('/', authorize('admin', 'security', 'visitor'), getPasses);
router.get('/qr/:qrCode', authorize('admin', 'security'), getPassByQR);
router.get('/:id', authorize('admin', 'security', 'visitor'), getPass);
router.get('/:id/pdf', authorize('admin', 'security', 'visitor'), downloadPassPDF);
router.post('/issue', authorize('admin', 'security'), issuePass);
router.patch('/:id/revoke', authorize('admin'), revokePass);

module.exports = router;