const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  ownerRegister,
  login,
  customerLogin,
  ownerLogin,
  getMe,
  updateProfile,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/owner/register", ownerRegister);
router.post("/login", login);
router.post("/customer/login", customerLogin);
router.post("/owner/login", ownerLogin);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);

module.exports = router;
