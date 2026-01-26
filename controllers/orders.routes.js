const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.js");
const isSignedIn = require("../middleware/is-signed-in.js");
const isAdmin = require("../middleware/is-admin.js");

// Admin routes (must come first)
router.get("/admin/dashboard", isSignedIn, isAdmin, ordersController.getAllOrders);
router.put("/:id/accept", isSignedIn, isAdmin, ordersController.acceptOrder);
router.put("/:id/reject", isSignedIn, isAdmin, ordersController.rejectOrder);
router.put("/:id/delivery-status", isSignedIn, isAdmin, ordersController.updateDeliveryStatus);

// Customer routes (come after admin routes)
router.post("/", isSignedIn, ordersController.createOrder);
router.get("/", isSignedIn, ordersController.getCustomerOrders);
router.get("/:id", isSignedIn, ordersController.getOrderDetail);

module.exports = router;
