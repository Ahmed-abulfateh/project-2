const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.js");
const isSignedIn = require("../middleware/is-signed-in.js");

router.post("/add", isSignedIn, cartController.addToCart);
router.get("/", isSignedIn, cartController.viewCart);
router.put("/:productId", isSignedIn, cartController.updateCartItem);
router.delete("/:productId", isSignedIn, cartController.removeFromCart);
router.post("/clear", isSignedIn, cartController.clearCart);

module.exports = router;
