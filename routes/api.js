var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var documentRouter = require("./document");
var notificationRouter = require("./notification");
var contactRouter = require("./contacts");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/document/", documentRouter);
app.use("/notification/", notificationRouter);
app.use("/contact/", contactRouter);

module.exports = app;