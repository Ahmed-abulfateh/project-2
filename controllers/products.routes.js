const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products.js");
const StockHistory = require("../models/StockHistory");
const isSignedIn = require("../middleware/is-signed-in.js");
const isAdmin = require("../middleware/is-admin.js");

// Admin routes (must come first to avoid conflict with /:id)
router.get("/admin/dashboard", isSignedIn, isAdmin, productsController.getAdminProducts);
router.get("/admin/stock-history", isSignedIn, isAdmin, async (req, res) => {
  try {
    const history = await StockHistory.find()
      .populate("product")
      .populate("adminId")
      .populate({
        path: "orderId",
        model: "Order"
      })
      .sort({ createdAt: -1 });
    res.render("stock/history.ejs", { history });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
router.post("/", isSignedIn, isAdmin, productsController.createProduct);
router.put("/:id", isSignedIn, isAdmin, productsController.updateProduct);
router.delete("/:id", isSignedIn, isAdmin, productsController.deleteProduct);
router.get("/:id/edit", isSignedIn, isAdmin, productsController.getEditProduct);

// Review routes (must come before /:id to avoid conflict)
router.post("/:id/reviews", isSignedIn, productsController.createReview);
router.delete("/:productId/reviews/:reviewId", isSignedIn, isAdmin, productsController.deleteReview);

// Customer routes (come after admin routes)
router.get("/", isSignedIn, productsController.getProducts);
router.get("/:id", isSignedIn, productsController.getProductDetail);

module.exports = router;
