const Document = require('../models/DocumentModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const Notification = require('../models/NotificationModel');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Upload and send a document
exports.sendDocument = async (req, res) => {
    try {
      const { receiversEmail, documentName, isPublic, isProtected, password } = req.body;
  
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one file is required" });
      }

      console.log(req.files);
  
      // Validate password if isProtected is true
      if (isProtected && (!password || password.trim() === "")) {
        return res.status(400).json({ message: 'Password is required for protected documents' });
      }

      const documentPromises = req.files.map((file, index) => {

        return new Document({
          sender: req.user._id, // Assuming `req.user` is populated by middleware
          receivers: receiversEmail.split(',').map(email => ({
            email: email.trim(),
            read: false,
          })), // Support for multiple receivers
          documentName,
          filePath: file.path,
          fileSize: file.size,
          isPublic: isPublic || false, // Default to false
          isProtected: isProtected || false, // Default to false
          password: isProtected ? password : undefined, // Set password only if protected
        });
      });
  
  
      const shared_documents = await Document.insertMany(documentPromises);
  
      res.status(201).json({
        message: 'Documents sent successfully',
        shared_documents,
      });
    } catch (error) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error(`Error deleting file: ${req.file.path}`, err);
          });
      res.status(500).json({
        message: 'Error sending documents',
        error: error.message,
      });
    }
  };
  

// List documents sent by the user
exports.listSentDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ sender: req.user }],
    });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error });
  }
};

// List documents receive by the user
exports.listReceivingDocuments = async (req, res) => {
    try {
      const documents = await Document.find({
        $or: [
          { receivers: { $elemMatch: { email: req.user.email } } },
          { forwardReceivers: { $elemMatch: { email: req.user.email } } }
        ],
        isDeleted: false
      }).populate('sender', 'firstName lastName email phoneNumber');

      // const documents = await Document.find({
      //   $or: [{ receivers: { $elemMatch: { email: req.user.email } }}],
      //   isDeleted: false
      // }).populate('sender', 'firstName lastName email phoneNumber');

      console.log(req.user.email)
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching documents', error });
    }
  };

  exports.markAsRead = async (req, res) => {
    const { readerEmail, password } = req.body;

    try {
    console.log(req.body);

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
                        return res.status(400).json({ message: "Invalid document id in params" });
                    }

                    if(readerEmail === ''){
                        return res.status(400).json({ message: "Invalid reader email" });
                    }
      
      const document = await Document.findById(req.params.id);

  
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
  
      // Validate password if the document is protected
      if (document.isProtected) {
        if (!password || password !== document.password) {
          return res.status(403).json({ message: "Invalid password" });
        }
      }
  
      // Update the `read` status for the receiver
      const receiver = document.receivers.find(r => r.email === readerEmail);
      if (receiver) {
        receiver.read = true;
      }else{
        var forwardReceiver = document.forwardReceivers.find(r => r.email === readerEmail);
        if (forwardReceiver) {
            forwardReceiver.read = true;
          }else{
            return res.status(404).json({ message: "Reader email not found in allowed readers/forwards list." });
          }
      }

  
      // Add the user to the `readers` list if not already present
    //   if (!document.readers.includes(userId)) {
    //     document.readers.push(userId);
    //   }


  
      await document.save();

      // Create a notification for the sender
    const notification = new Notification({
        user: document.sender,
        title: "Document Read",
        message: `${readerEmail} has read your document: ${document.documentName}`,
      });

      await notification.save();
  
      res.status(200).json({ message: "Document marked as read" });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: "Error marking document as read", error });
    }
  };

  exports.forwardDocument = async (req, res) => {
    const { forwardReceiversEmail } = req.body;

    try {
    console.log(req.body);

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
                        return res.status(400).json({ message: "Invalid document id in params" });
                    }

                    if(forwardReceiversEmail === ''){
                        return res.status(400).json({ message: "Invalid reader email" });
                    }
      
      const document = await Document.findById(req.params.id);

  
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Add new forward receivers
      const newForwardReceivers = forwardReceiversEmail.split(',').map(email => ({
        email: email.trim(),
        read: false,
      }));

      document.forwardReceivers = document.forwardReceivers.concat(newForwardReceivers);
      

      await document.save();

      // Create a notification for the sender
    const notification = new Notification({
        user: document.sender,
        title: "Document Forwarded",
        message: `document: ${document.documentName} has been forwarded to ${forwardReceiversEmail}`,
      });

      await notification.save();
  
      res.status(200).json({ message: "Document forwarded successfully!" });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: "Error forwarding documents", error });
    }
  };

  exports.deleteDocuments = async (req, res) => {
    const { documentIds } = req.body;
  
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ message: 'Invalid document IDs provided.' });
    }
  
    try {
      // Find documents based on IDs and ensure they belong to the logged-in user
      const documents = await Document.find({
        _id: { $in: documentIds },
        sender: req.user._id,
      });
  
      if (documents.length === 0) {
        return res.status(404).json({ message: 'No documents found or access denied.' });
      }
  
      const documentUpdates = [];
  
      // Process each document
      for (const document of documents) {
        const filePath = path.resolve(document.filePath);
  
        // Delete file from the uploads folder
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
  
        // Mark the document as deleted
        document.isDeleted = true;
        document.deletedAt = new Date();
        documentUpdates.push(document.save());
      }
  
      // Wait for all updates to be saved
      await Promise.all(documentUpdates);
  
      res.status(200).json({ message: 'Documents deleted successfully.'});
    } catch (error) {
      console.error('Error deleting documents:', error);
      res.status(500).json({ message: 'Error deleting documents.', error });
    }
  };


  

exports.uploadMiddleware = upload.array("files", 10);
