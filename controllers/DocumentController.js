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
  
      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }
  
      // Validate password if isProtected is true
      if (isProtected && (!password || password.trim() === "")) {
        return res.status(400).json({ message: 'Password is required for protected documents' });
      }
  
      const document = new Document({
        sender: req.user._id, // Assuming `req.user` is populated by middleware
        receivers: receiversEmail.split(',').map(email => ({
          email: email.trim(),
          read: false,
        })), // Support for multiple receivers
        documentName,
        filePath: req.file.path,
        fileSize: req.file.size,
        isPublic: isPublic || false, // Default to false
        isProtected: isProtected || false, // Default to false
        password: isProtected ? password : undefined, // Set password only if protected
      });
  
      await document.save();
  
      res.status(201).json({
        message: 'Document sent successfully',
        document,
      });
    } catch (error) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error(`Error deleting file: ${req.file.path}`, err);
          });
      res.status(500).json({
        message: 'Error sending document',
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
        receivers: {
            $elemMatch: { email: req.user.email, read: false }
        },
      }).populate('sender', 'firstName lastName email');
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
        return res.status(404).json({ message: "Reader email not found in allowed readers list." });
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
  

exports.uploadMiddleware = upload.single('file');
