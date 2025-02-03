const Contact = require('../models/ContactModel');
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