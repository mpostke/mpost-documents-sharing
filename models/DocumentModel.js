const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema(
  {
    sender: { type: Schema.ObjectId, ref: "User", required: true }, // Sender of the document
    receivers: [
      {
        email: { type: String, required: true }, // Email of the receiver
        read: { type: Boolean, default: false }, // Whether the receiver has read the document
      },
    ],
    forwardReceivers: [
      {
        email: { type: String, required: true }, // Email of the receiver
        read: { type: Boolean, default: false }, // Whether the receiver has read the document
      },
    ],
    documentName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    isPublic: { type: Boolean, default: false }, // Whether the document is public
    isDeleted: { type: Boolean, default: false }, // Whether the document is public
    deletedAt: { type: Date }, // Date when the document is deleted
    isProtected: { type: Boolean, default: false }, // Whether the document is password-protected
    password: { type: String }, // Password for protected documents (hashed if needed)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
