const express = require('express');
const router = express.Router();
const { sendDocument, listSentDocuments: listSentDocuments, listReceivingDocuments, uploadMiddleware, markAsRead , deleteDocuments, forwardDocument} = require('../controllers/DocumentController');
const authenticate = require('../middlewares/jwt'); // Replace with your auth middleware

router.post('/send',authenticate, uploadMiddleware, sendDocument);
router.get('/list-sent', authenticate, listSentDocuments);
router.get('/list-receiving', authenticate, listReceivingDocuments);
router.post('/mark-as-read/:id', markAsRead);
router.post('/delete-ids', authenticate, deleteDocuments);
router.post('/forward/:id', authenticate, forwardDocument);

module.exports = router;
