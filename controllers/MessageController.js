const Message = require('../models/MessageModel');
const Document = require('../models/DocumentModel');
const auth = require("../middlewares/jwt");
const apiResponse = require("../helpers/apiResponse");

exports.addMessage = [
    async function (req, res) {


        const { documentId, senderEmail, message, replyTo } = req.body;

  try {
    const document = await Document.findById(documentId).populate('sender', 'firstName lastName email');
    if (!document) return apiResponse.notFoundResponse(res,"Document not found");

    // Check if the user is a valid participant
    const isValidUser =
      document.sender.email === senderEmail ||
      document.receivers.some(r => r.email === senderEmail) ||
      document.forwardReceivers.some(r => r.email === senderEmail);

    if (!isValidUser) {
      return res.status(403).json({ message: 'You are not authorized to add messages to this document' });
    }

    const newMessage = new Message({ documentId, senderEmail, message, replyTo });
    await newMessage.save();

     const notification = new Notification({
            user: document.sender,
            title: "New message on document: " + document.documentName,
            message: "New message on document: " + document.documentName + " from " + senderEmail,
          });

    await notification.save();

    return apiResponse.successResponseWithData(res, "Message added successfully", newMessage);
  } catch (error) {
    return apiResponse.ErrorResponse(res, error);
  }
      }
]

exports.getMessagesByDocument = async (req, res) => {
    try {
      const messages = await Message.find({ documentId: req.params.documentId }).sort({ createdAt: 1 });
      return apiResponse.successResponseWithData(res, "Message get successfully", messages);
    } catch (error) {
        return apiResponse.ErrorResponse(res, error);
    }
  };
  

  exports.acknowledgeMessage = async (req, res) => {
    const { messageId, email } = req.body;
  
    try {
      const message = await Message.findById(messageId);
      if (!message) return apiResponse.notFoundResponse(res,"Message not found");
  
      const document = await Document.findById(message.documentId);
      if (!document) return apiResponse.notFoundResponse(res,"Document not found");
  
      // Check if the user is a valid participant
      const isValidUser =
        document.receivers.some(r => r.email === email) ||
        document.forwardReceivers.some(r => r.email === email);
  
      if (!isValidUser) {
        return res.status(403).json({ message: 'You are not authorized to acknowledge this message' });
      }
  
      if (!message.acknowledgment.includes(email)) {
        message.acknowledgment.push(email);
        await message.save();
        const notification = new Notification({
            user: document.sender,
            title: "Acknowledged on document: " + document.documentName,
            message: "New Acknowledged on document: " + document.documentName + " by " + email,
          });
          
    await notification.save();
      }
      return apiResponse.successResponseWithData(res, "Message acknowledged successfully", messages);
    } catch (error) {
        return apiResponse.ErrorResponse(res, error);
    }
  };
  