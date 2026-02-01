const express = require("express");
const router = express.Router();
const wishlistController = require("./wishlist.js");

// Wishlist page
router.get("/", wishlistController.getWishlist);

// Add/remove from wishlist (AJAX)
router.post("/:productId", wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

// Check if product in wishlist (AJAX)
router.get("/:productId/check", wishlistController.checkWishlist);

// Clear wishlist
router.post("/actions/clear", wishlistController.clearWishlist);

module.exports = router;
