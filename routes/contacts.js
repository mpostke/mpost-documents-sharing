const express = require('express');
const router = express.Router();
const contactController = require('../controllers/ContactController');

router.post('/', contactController.createContact);
router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.put('/restore/:id', contactController.restoreContact);
router.delete('/permanent/:id', contactController.deleteContactPermanently);

module.exports = router;
