var express = require("express");
const AuthController = require("../controllers/AuthController");

var router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify-otp", AuthController.verifyConfirm);
router.post("/resend-verify-otp", AuthController.resendConfirmOtp);
router.put("/update-user/:id", AuthController.userUpdate);
router.get("/user-details", AuthController.userDetails);
router.post("/set-profile-image", AuthController.uploadProfileImage);
router.post("/forget-password-request", AuthController.forgetPasswordRequest);

module.exports = router;