const express = require("express");
const router = express.Router();
const couponsController = require("./coupons.js");
const isSignedIn = require("../middleware/is-signed-in.js");
const isAdmin = require("../middleware/is-admin.js");

// Admin routes
router.get("/", isSignedIn, isAdmin, couponsController.getCouponsManagement);
router.post("/", isSignedIn, isAdmin, couponsController.createCoupon);
router.get("/:id/edit", isSignedIn, isAdmin, couponsController.getEditCoupon);
router.put("/:id", isSignedIn, isAdmin, couponsController.updateCoupon);
router.delete("/:id", isSignedIn, isAdmin, couponsController.deleteCoupon);

// Customer: Validate coupon (AJAX)
router.post("/validate", isSignedIn, couponsController.validateCoupon);

module.exports = router;
