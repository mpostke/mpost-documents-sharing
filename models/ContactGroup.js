const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const contactSchema = Schema(
  {
    name: { type: String, required: true },
    contacts: [
        { type: Schema.ObjectId, ref: "Contact" }
    ],
    isArchived: { type: Boolean, default: false },
    user: { type: Schema.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactGroup', contactSchema);
