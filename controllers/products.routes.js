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
        model: "Order",
        populate: {
          path: "customer",
          model: "User"
        }
      })
      .sort({ createdAt: -1 });

    // Calculate category totals and profits
    const categoryTotals = {};
    let totalProfit = 0;

    history.forEach(record => {
      if (record.product && record.product.category) {
        const category = record.product.category;
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = {
            quantity: 0,
            profit: 0
          };
        }

        categoryTotals[category].quantity += record.quantity;

        // Calculate profit: only for customer orders (sales)
        if (record.changeType === "customer-order") {
          const profit = Math.abs(record.quantity) * record.product.price;
          categoryTotals[category].profit += profit;
          totalProfit += profit;
        }
      }
    });

    res.render("stock/history.ejs", { history, categoryTotals, totalProfit });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.get("/admin/stock-history/download", isSignedIn, isAdmin, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    const history = await StockHistory.find()
      .populate("product")
      .populate("adminId")
      .populate({
        path: "orderId",
        model: "Order",
        populate: {
          path: "customer",
          model: "User"
        }
      })
      .sort({ createdAt: -1 });

    // Prepare data for Excel
    const excelData = history.map(record => ({
      'Product Name': record.product ? record.product.name : 'N/A',
      'Category': record.product ? record.product.category : 'N/A',
      'Price': record.product ? record.product.price.toFixed(2) : 'N/A',
      'Quantity Change': record.quantity,
      'Change Type': record.changeType,
      'Admin/User': record.adminId ? `${record.adminId.username} (Admin)` : 'Customer Order',
      'Customer Username': record.orderId && record.orderId.customer ? record.orderId.customer.username : '-',
      'Order ID': record.orderId && record.orderId._id ? record.orderId._id.toString() : '-',
      'Notes': record.notes || '-',
      'Date': new Date(record.createdAt).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Stock History");

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename=stock-history.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.log(error);
    res.send("Error generating Excel file");
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
