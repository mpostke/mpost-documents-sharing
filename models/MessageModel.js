const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    senderEmail: { type: String, required: true }, // Sender's email
    message: { type: String, required: true },
    acknowledgment: [{ type: String }], // List of emails who acknowledged
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }, // Parent message
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
