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

// contact groups
router.post('/group', contactController.createContactGroup);
router.post('/get-groups/', contactController.getAllContactGroups);
router.get('/group/:id', contactController.getContactGroupById);
router.put('/group/add-contact', contactController.addContactToGroup);
router.put('/group/remove-contact', contactController.removeContactFromGroup);
router.put('/group/:id', contactController.updateContactGroup);

module.exports = router;
