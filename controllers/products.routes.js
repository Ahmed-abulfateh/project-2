const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products.js");
const StockHistory = require("../models/StockHistory");
const Product = require("../models/Product");
const isSignedIn = require("../middleware/is-signed-in.js");
const isAdmin = require("../middleware/is-admin.js");

async function getStockHistoryData(req, { paginate = false } = {}) {
  const {
    changeType = "all",
    actor = "all",
    category = "all",
    productId = "all",
    dateFrom = "",
    dateTo = "",
    search = "",
    sort = "date",
    order = "desc",
    page = "1",
    limit = "25",
  } = req.query;

  const filter = {};

  if (changeType && changeType !== "all") {
    filter.changeType = changeType;
  }

  if (actor === "admin") {
    filter.adminId = { $ne: null };
  } else if (actor === "customer") {
    filter.adminId = null;
  }

  if (productId && productId !== "all") {
    filter.product = productId;
  } else if (category && category !== "all") {
    const productIds = await Product.find({ category }).select("_id");
    filter.product = { $in: productIds.map(p => p._id) };
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  let history = await StockHistory.find(filter)
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

  const q = search && search.trim().toLowerCase();
  if (q) {
    history = history.filter(record => {
      const orderId = record.orderId && record.orderId._id
        ? record.orderId._id.toString()
        : (record.orderId ? record.orderId.toString() : "");
      const adminUsername = record.adminId?.username || "";
      const customerUsername = record.orderId?.customer?.username || "";
      return orderId.toLowerCase().includes(q) ||
        adminUsername.toLowerCase().includes(q) ||
        customerUsername.toLowerCase().includes(q);
    });
  }

  const direction = order === "asc" ? 1 : -1;
  history = history.sort((a, b) => {
    let aVal;
    let bVal;

    if (sort === "quantity") {
      aVal = a.quantity;
      bVal = b.quantity;
    } else if (sort === "price") {
      aVal = a.product?.price ?? 0;
      bVal = b.product?.price ?? 0;
    } else {
      aVal = a.createdAt;
      bVal = b.createdAt;
    }

    if (aVal < bVal) return -1 * direction;
    if (aVal > bVal) return 1 * direction;
    return 0;
  });

  const filters = {
    changeType,
    actor,
    category,
    productId,
    dateFrom,
    dateTo,
    search,
    sort,
    order,
    page,
    limit,
  };

  if (!paginate) {
    return { history, filters };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10) || 25));
  const total = history.length;
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const currentPage = Math.min(pageNum, totalPages);
  const start = (currentPage - 1) * limitNum;
  const pagedHistory = history.slice(start, start + limitNum);

  return {
    history: pagedHistory,
    fullHistory: history,
    pagination: { page: currentPage, limit: limitNum, total, totalPages },
    filters,
  };
}

// Admin routes (must come first to avoid conflict with /:id)
router.get("/admin/dashboard", isSignedIn, isAdmin, productsController.getAdminProducts);

router.get("/admin/stock-history", isSignedIn, isAdmin, async (req, res) => {
  try {
    const [data, products, categories] = await Promise.all([
      getStockHistoryData(req, { paginate: true }),
      Product.find().select("name category").sort({ name: 1 }),
      Product.distinct("category")
    ]);

    const summarySource = data.fullHistory || data.history;

    const categoryTotals = {};
    let totalProfit = 0;
    
    // Track discounts per order to avoid double counting
    const orderDiscounts = {};

    summarySource.forEach(record => {
      if (record.product && record.product.category) {
        const category = record.product.category;

        if (!categoryTotals[category]) {
          categoryTotals[category] = {
            quantity: 0,
            profit: 0
          };
        }

        categoryTotals[category].quantity += record.quantity;

        if (record.changeType === "customer-order") {
          const profit = Math.abs(record.quantity) * record.product.price;
          categoryTotals[category].profit += profit;
          totalProfit += profit;
          
          // Subtract coupon discount from profit (only once per order)
          if (record.orderId && record.orderId.discountAmount) {
            const orderId = record.orderId._id.toString();
            if (!orderDiscounts[orderId]) {
              orderDiscounts[orderId] = record.orderId.discountAmount;
              categoryTotals[category].profit -= record.orderId.discountAmount;
              totalProfit -= record.orderId.discountAmount;
            }
          }
        }
      }
    });

    res.render("stock/history.ejs", {
      history: data.history,
      categoryTotals,
      totalProfit,
      products,
      categories,
      filters: data.filters,
      pagination: data.pagination,
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.get("/admin/stock-history/download", isSignedIn, isAdmin, async (req, res) => {
  try {
    const XLSX = require("xlsx");
    const data = await getStockHistoryData(req, { paginate: false });

    const excelData = data.history.map(record => ({
      "Product Name": record.product ? record.product.name : "N/A",
      "Category": record.product ? record.product.category : "N/A",
      "Price": record.product ? record.product.price.toFixed(2) : "N/A",
      "Quantity Change": record.quantity,
      "Change Type": record.changeType,
      "Discount": record.orderId && record.orderId.discountAmount > 0 ? `-$${record.orderId.discountAmount.toFixed(2)}` : "-",
      "Coupon Code": record.orderId && record.orderId.couponCode ? record.orderId.couponCode : "-",
      "Admin/User": record.adminId ? `${record.adminId.username} (Admin)` : "Customer",
      "Customer Username": record.orderId && record.orderId.customer ? record.orderId.customer.username : "-",
      "Order ID": record.orderId && record.orderId._id ? record.orderId._id.toString() : "-",
      "Notes": record.notes || "-",
      "Date": new Date(record.createdAt).toLocaleDateString()
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const currentDate = new Date();
    const worksheetName = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    XLSX.utils.book_append_sheet(wb, ws, worksheetName);

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `stock-history-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
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

// Variant management routes
router.get("/:id/variants", isSignedIn, isAdmin, productsController.getVariantsManagement);
router.post("/:id/variants", isSignedIn, isAdmin, productsController.addVariant);
router.delete("/:id/variants/:variantId", isSignedIn, isAdmin, productsController.deleteVariant);
router.put("/:id/variants/:variantId", isSignedIn, isAdmin, productsController.updateVariant);

// Review routes (must come before /:id to avoid conflict)
router.post("/:id/reviews", isSignedIn, productsController.createReview);
router.delete("/:productId/reviews/:reviewId", isSignedIn, isAdmin, productsController.deleteReview);
router.post("/:productId/reviews/:reviewId/helpful", isSignedIn, productsController.markReviewHelpful);

// Customer routes (come after admin routes)
router.get("/", isSignedIn, productsController.getProducts);
router.get("/:id", isSignedIn, productsController.getProductDetail);

module.exports = router;
