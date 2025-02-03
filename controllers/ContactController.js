const Contact = require('../models/ContactModel');
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");

exports.createContact = [
    auth,
    async function (req, res) {
        try {
          const contact = new Contact(req.body);
          await contact.save();
          return apiResponse.successResponseWithData(res, "Contact created successfully", contact);
        } catch (error) {
          return apiResponse.ErrorResponse(res, error);
        }
      }
]
