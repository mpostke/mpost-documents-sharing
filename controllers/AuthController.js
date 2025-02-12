const UserModel = require("../models/UserModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

	// Set up multer for file upload
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, "profile-image/");
		},
		filename: function (req, file, cb) {
			cb(null, Date.now() + path.extname(file.originalname));
		}
	});

	const fileFilter = (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed!"), false);
		}
	};

	const upload = multer({
		storage: storage,
		limits: { fileSize: 1 * 1024 * 1024 }, // 1MB file size limit
		fileFilter: fileFilter
	});

/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.").custom((value) => {
			return UserModel.findOne({email : value}).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp,
							phoneNumber: req.body.phoneNumber,
							countryCode: req.body.countryCode,
							country: req.body.country,
							city: req.body.city,
						}
					);
					// Html email body
					let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
					// Send confirmation email
					// Save user.
					user.save(function (err) {
						if (err) { return apiResponse.ErrorResponse(res, err); }
						let userData = {
							_id: user._id,
							firstName: user.firstName,
							lastName: user.lastName,
							email: user.email,
							phoneNumber: user.phoneNumber,
							countryCode: user.countryCode,
							country: user.country,
							city: user.city
						};
						return apiResponse.successResponseWithData(res,"Registration Success.", userData);
					});
					// mailer.send(
					// 	constants.confirmEmails.from, 
					// 	req.body.email,
					// 	"Confirm Account",
					// 	html
					// ).then(function(){
					// }).catch(err => {
					// 	console.log(err);
					// 	return apiResponse.ErrorResponse(res,err);
					// }) ;
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				UserModel.findOne({email : req.body.email}).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password,user.password,function (err,same) {
							if(same){
								//Check account confirmation.
								if(user.isConfirmed){
									// Check User's account active or not.
									if(user.status) {
										let userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
											phoneNumber: user.phoneNumber,
											profileImage: user.profileImage
										};
										//Prepare JWT token for authentication
										const jwtPayload = userData;
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION,
										};
										const secret = process.env.JWT_SECRET;
										//Generated JWT token with Payload and secret.
										userData.token = jwt.sign(jwtPayload, secret, jwtData);
										return apiResponse.successResponseWithData(res,"Login Success.", userData);
									}else {
										return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
									}
								}else{
									return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
								}
							}else{
								return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
							}
						});
					}else{
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];


	exports.userDetails = [
		auth,
		(req, res) => {
			try {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
				}else {
					UserModel.findOne({email : req.user.email}).then(user => {
						if (user) {
							console.log("User: ", user);
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								profileImage: user.profileImage,
								email: user.email,
								phoneNumber: user.phoneNumber,
								countryCode: user.countryCode,
								country: user.country,
								city: user.city,
								createdAt: user.createdAt,
								updateAt: user.updatedAt,
							};
							return apiResponse.successResponseWithData(res,"User data.", userData);
							//Compare given password with db's hash.
							
						}else{
							return apiResponse.unauthorizedResponse(res, "Email is wrong.");
						}
					});
				}
			} catch (err) {
				return apiResponse.ErrorResponse(res, err);
			}
		}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							//Check account confirmation.
							if(user.confirmOTP == req.body.otp){
								//Update user as confirmed
								UserModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null 
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
								return apiResponse.successResponse(res,"Account confirmed success.");
							}else{
								return apiResponse.unauthorizedResponse(res, "Otp does not match");
							}
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from, 
								req.body.email,
								"Confirm Account",
								html
							).then(function(){
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err); }
									return apiResponse.successResponse(res,"Confirm otp sent.");
								});
							});
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];



	exports.userUpdate = [
		auth,
		// Validate fields.
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
	.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.find({email : value}).then((users) => {
				if (users.length > 1) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
		sanitizeBody("*").escape(),
		(req, res) => {
			try {
				const errors = validationResult(req);
				var user = new UserModel(
					{
						firstName: req.body.firstName,
						lastName: req.body.lastName,
						email: req.body.email,
						phoneNumber: req.body.phoneNumber,
						countryCode: req.body.countryCode,
						country: req.body.country,
						city: req.body.city,
					}
				);
	
				if (!errors.isEmpty()) {
					return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
				}
				else {
					if(!mongoose.Types.ObjectId.isValid(req.params.id)){
						return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
					}else{
						UserModel.findById(req.params.id, function (err, foundUser) {
							if(foundUser === null){
								return apiResponse.notFoundResponse(res,"User not exists with this id");
							}else{
								//update book.
								UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, updatedUser) {
									if (err) {
										console.log("Error: ", err);
										return apiResponse.ErrorResponse(res, err);
									} else {
										return apiResponse.successResponseWithData(res, "User updated Success.", updatedUser);
									}
								});
								// UserModel.findByIdAndUpdate(req.params.id, user, {},function (err) {
								// 	if (err) { 
								// 		console.log("Error: ", err);
								// 		return apiResponse.ErrorResponse(res, err); 
								// 	}else{
								// 		return apiResponse.successResponseWithData(res,"User updated Success.", user);
								// 	}
								// });
							}
						});
					}
				}
			} catch (err) {
				//throw error in json response with status 500. 
				// console.log("Error: ", err);
				return apiResponse.ErrorResponse(res, err);
			}
		}
	];


	/**
	 * Upload profile image.
	 *
	 * @param {string}      profileImage
	 *
	 * @returns {Object}
	 */
	exports.uploadProfileImage = [
		auth,
		upload.single("profileImage"),
		(req, res) => {
			try {
				if (!req.file) {
					return apiResponse.validationErrorWithData(res, "Validation Error.", "No file uploaded");
				}
				UserModel.findById(req.user._id, (err, user) => {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					if (user.profileImage) {
						fs.unlink(user.profileImage, (err) => {
							if (err) {
								return apiResponse.ErrorResponse(res, err);
							}
						});
					}
				});
				UserModel.findByIdAndUpdate(req.user._id, { profileImage: req.file.path }, { new: true }, (err, user) => {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					}
					return apiResponse.successResponse(res, "Profile image uploaded successfully.");
				});
			} catch (err) {
				return apiResponse.ErrorResponse(res, err);
			}
		}
	];


	exports.forgetPasswordRequest = [
		(req, res) => {
			try {
				let otp = utility.randomNumber(4);
				let html = "<p>Use this OTP to reset you password.</p><p>OTP: "+otp+"</p>";
				mailer.send(
						constants.confirmEmails.from, 
						req.body.email,
						"OTP to reset your password",
						html
					).then(function(){
						return apiResponse.successResponse(res, "Email sent");

					}).catch(err => {
						console.log(err);
						return apiResponse.ErrorResponse(res,err);
					}) ;
			} catch (err) {
				return apiResponse.ErrorResponse(res, err);
			}
		}
	];