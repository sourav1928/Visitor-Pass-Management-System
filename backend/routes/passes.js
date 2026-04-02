const express = require('express');
const router = express.Router();
const {
  getPasses, getPassByQR, getPass,
  issuePass, revokePass, downloadPassPDF,
} = require('../controllers/passController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);

router.get('/', authorize('admin', 'security'), getPasses);
router.get('/qr/:qrCode', authorize('admin', 'security'), getPassByQR);
router.get('/:id', getPass);
router.get('/:id/pdf', downloadPassPDF);
router.post('/issue', authorize('admin', 'security'), issuePass);
router.patch('/:id/revoke', authorize('admin'), revokePass);

module.exports = router;
