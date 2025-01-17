const mongoose = require('mongoose');

var Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: { type: Schema.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  hasBeenRead: { type: Boolean, default: false },
  datetime: { type: Date, default: Date.now },
}, {timestamps: true});

module.exports = mongoose.model('Notification', notificationSchema);
