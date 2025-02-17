const Contact = require('../models/ContactModel');
const ContactGroup = require('../models/ContactGroup');
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");

exports.createContact = [
    auth,
    async function (req, res) {
        try {
          const contact = new Contact(req.body);
          contact.user = req.user;
          await contact.save();
          return apiResponse.successResponseWithData(res, "Contact created successfully", contact);
        } catch (error) {
          return apiResponse.ErrorResponse(res, error);
        }
      }
]

exports.createContactGroup = [
  auth,
  async function (req, res) {
      try {
        const contactGroup = new ContactGroup(req.body);
        contactGroup.user = req.user;
        await contactGroup.save();
        return apiResponse.successResponseWithData(res, "Contact Group created successfully", contactGroup);
      } catch (error) {
        return apiResponse.ErrorResponse(res, error);
      }
    }
]

exports.addContactToGroup = [
  auth,
  async function (req, res) {
    try {
      const contactGroup = await ContactGroup.findById(req.body.groupId);
      if (!contactGroup) return apiResponse.notFoundResponse(res, "Contact Group not found");

      const contact = await Contact.findById(req.body.contactId);
      if (!contact) return apiResponse.notFoundResponse(res, "Contact not found");

      contactGroup.contacts.push(contact._id);
      await contactGroup.save();

      return apiResponse.successResponseWithData(res, "Contact added to group successfully", contactGroup);
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  }
];

exports.removeContactFromGroup = [
  auth,
  async function (req, res) {
    try {
      const contactGroup = await ContactGroup.findById(req.body.groupId);
      if (!contactGroup) return apiResponse.notFoundResponse(res, "Contact Group not found");

      const contactIndex = contactGroup.contacts.indexOf(req.body.contactId);
      if (contactIndex === -1) return apiResponse.notFoundResponse(res, "Contact not found in group");

      contactGroup.contacts.splice(contactIndex, 1);
      await contactGroup.save();

      return apiResponse.successResponseWithData(res, "Contact removed from group successfully", contactGroup);
    } catch (error) {
      return apiResponse.ErrorResponse(res, error);
    }
  }
];



exports.getAllContacts = [
    auth,
    async function (req, res) {
        try {
            const filter = {};
            if (req.query.status) filter.status = req.query.status === 'true';
            if (req.query.isArchived) filter.isArchived = req.query.isArchived === 'true';
            filter.user = req.user._id;
            const contacts = await Contact.find(filter);
            return apiResponse.successResponseWithData(res, "Contacts get successfully", contacts);
          } catch (error) {
            return apiResponse.ErrorResponse(res, error);
          }
      }
]

exports.getAllContactGroups = [
  auth,
  async function (req, res) {
      try {
          const filter = {};
          if (req.query.isArchived) filter.isArchived = req.query.isArchived === 'true';
          filter.user = req.user._id;
          const contactGroups = await ContactGroup.find(filter).populate('user', 'firstName lastName email phoneNumber');
          await ContactGroup.populate(contactGroups, { path: 'contacts' });
          return apiResponse.successResponseWithData(res, "Contact Groups get successfully", contactGroups);
        } catch (error) {
          console.log(error);
          return apiResponse.ErrorResponse(res, error);
        }
    }
]


exports.getContactById = [
    auth,
    async function (req, res) {
        try {
            const contact = await Contact.findById(req.params.id);
            if (!contact) return apiResponse.notFoundResponse(res,"Contact not found");
            return apiResponse.successResponseWithData(res, "Contact get successfully", contact);
        } catch (error) {
            return apiResponse.ErrorResponse(res, error);
        }
    }
];

exports.getContactGroupById = [
  auth,
  async function (req, res) {
      try {
          const contactGroup = await ContactGroup.findById(req.params.id);
          if (!contactGroup) return apiResponse.notFoundResponse(res,"Contact Group not found");
          return apiResponse.successResponseWithData(res, "Contact Group get successfully", contactGroup);
      } catch (error) {
          return apiResponse.ErrorResponse(res, error);
      }
  }
];

exports.updateContact = [
    auth,
    async function (req, res) {
        try {
            const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
            if (!contact) return apiResponse.notFoundResponse(res,"Contact not found");
        
            return apiResponse.successResponseWithData(res, "Contact updated successfully", contact);
          } catch (error) {
            return apiResponse.ErrorResponse(res, error);
          }
    }
];

exports.updateContactGroup = [
  auth,
  async function (req, res) {
      try {
          const contactGroup = await ContactGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
      
          if (!contactGroup) return apiResponse.notFoundResponse(res,"Contact Group not found");
      
          return apiResponse.successResponseWithData(res, "Contact Group updated successfully", contactGroup);
        } catch (error) {
          return apiResponse.ErrorResponse(res, error);
        }
  }
];

exports.deleteContact = [
    auth,
    async function (req, res) {
        try {
            const contact = await Contact.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });

            if (!contact) return apiResponse.notFoundResponse(res,"Contact not found");

            return apiResponse.successResponseWithData(res, "Contact archived successfully", contact);

          } catch (error) {
            return apiResponse.ErrorResponse(res, error);
          }
    }
];

exports.restoreContact = [
    auth,
    async function (req, res) {
        try {
            const contact = await Contact.findByIdAndUpdate(req.params.id, { isArchived: false }, { new: true });

            if (!contact) return apiResponse.notFoundResponse(res,"Contact not found");

            return apiResponse.successResponseWithData(res, "Contact restored successfully", contact);

          } catch (error) {
            return apiResponse.ErrorResponse(res, error);
          }
    }
];

exports.deleteContactPermanently = [
    auth,
    async function (req, res) {
        try {
            const contact = await Contact.findByIdAndDelete(req.params.id);

            if (!contact) return apiResponse.notFoundResponse(res,"Contact not found");

            return apiResponse.successResponseWithData(res, "Contact permanently deleted successfully", contact);

          } catch (error) {
            return apiResponse.ErrorResponse(res, error);
          }
    }
];