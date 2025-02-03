const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const contactSchema = Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Optional
    phoneNumbers: [
      {
        title: { type: String, required: true }, // e.g., Home, Work, Mobile
        number: { type: String, required: true },
      },
    ],
    dob: { type: Date },
    notes: { type: String },
    isArchived: { type: Boolean, default: false },
    status: { type: Boolean, default: true }, // Active or Inactive
    user: { type: Schema.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
