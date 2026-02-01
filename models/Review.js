const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
