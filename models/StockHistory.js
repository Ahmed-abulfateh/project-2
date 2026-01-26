const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true, // positive for add, negative for subtract/order
  },
  changeType: {
    type: String,
    enum: ["admin-add", "admin-subtract", "customer-order", "order-rejected"],
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, 
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null, 
    sparse: true,
  },
  notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

module.exports = StockHistory;
