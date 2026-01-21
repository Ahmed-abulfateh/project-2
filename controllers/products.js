const Product = require("../models/Product");
const StockHistory = require("./models/StockHistory");
const Review = require("./models/Review");

// Admin: Create a new product
async function createProduct(req, res) {
  try {
    const { name, description, price, stock } = req.body;
    
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      createdBy: req.session.user._id,
    });

    await newProduct.save();
    res.redirect("/products");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Get all products (for customers)
async function getProducts(req, res) {
  try {
    const products = await Product.find();
    res.render("products/index.ejs", { products });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get all products with edit/delete options
async function getAdminProducts(req, res) {
  try {
    const products = await Product.find();
    res.render("products/admin.ejs", { products });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Get single product details
async function getProductDetail(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    const reviews = await Review.find({ product: req.params.id })
      .populate("user")
      .sort({ createdAt: -1 });
    
    // Check if current user has already reviewed this product
    const userReview = await Review.findOne({
      product: req.params.id,
      user: req.session.user._id,
    });
    
    res.render("products/show.ejs", { product, reviews, userHasReviewed: !!userReview, currentUser: req.session.user });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get edit product page
async function getEditProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    res.render("products/edit.ejs", { product });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Update product
async function updateProduct(req, res) {
  try {
    const { name, description, price, stock } = req.body;
    const product = await Product.findById(req.params.id);
    
    // Track stock change if stock was modified
    if (product.stock !== parseInt(stock)) {
      const stockChange = parseInt(stock) - product.stock;
      const changeType = stockChange > 0 ? "admin-add" : "admin-subtract";
      
      await StockHistory.create({
        product: req.params.id,
        quantity: stockChange,
        changeType: changeType,
        adminId: req.session.user._id,
        notes: `Updated from ${product.stock} to ${stock}`,
      });
    }
    
    await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, stock },
      { new: true }
    );

    res.redirect("/products/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Delete product
async function deleteProduct(req, res) {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Create a review for a product (one review per user per product)
async function createReview(req, res) {
  try {
    const { rating, comment } = req.body;
    
    // Check if user already has a review for this product
    const existingReview = await Review.findOne({
      product: req.params.id,
      user: req.session.user._id,
    });
    
    if (existingReview) {
      return res.status(400).send("You have already reviewed this product. You can only leave one review per product.");
    }
    
    const newReview = new Review({
      product: req.params.id,
      user: req.session.user._id,
      rating,
      comment,
    });

    await newReview.save();
    res.redirect(`/products/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Delete a review
async function deleteReview(req, res) {
  try {
    const { reviewId, productId } = req.params;
    
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/products/${productId}`);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductDetail,
  getEditProduct,
  updateProduct,
  deleteProduct,
  createReview,
  deleteReview,
};
