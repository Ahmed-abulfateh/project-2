const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.js");
const isSignedIn = require("../middleware/is-signed-in.js");

// All profile routes require authentication
router.use(isSignedIn);

// Profile page
router.get("/", profileController.getProfile);
router.put("/", profileController.updateProfile);
router.put("/preferences", profileController.updateNotificationPreferences);

// Order history
router.get("/orders", profileController.getOrderHistory);

// Saved addresses
router.get("/addresses", profileController.getSavedAddresses);
router.post("/addresses", profileController.addAddress);
router.delete("/addresses/:addressId", profileController.deleteAddress);
router.put("/addresses/:addressId/default", profileController.setDefaultAddress);

module.exports = router;
