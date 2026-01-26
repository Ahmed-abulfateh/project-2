const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ["Electronics", "Clothing", "Home & Garden", "Sports", "Books", "Toys", "Food & Beverages", "Health & Beauty", "Other"],
    default: "Other",
  },
  imageUrl: {
    type: String,
    default: "https://via.placeholder.com/400x300?text=No+Image",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
