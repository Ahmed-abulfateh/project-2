const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");

// Get all products for the signed-in user
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ userId: req.session.user._id });
    
    if (products.length === 0) {
      return res.render("products/index.ejs", {
        products: [],
        message: "No products found. Create one to get started!",
      });
    }
    
    res.render("products/index.ejs", { products, message: null });
  } catch (error) {
    res.status(500).send("Error fetching products");
  }
});

// Get the form to create a new product
router.get("/new", (req, res) => {
  res.render("products/new.ejs");
});

// Create a new product
router.post("/", async (req, res) => {
  try {
    req.body.userId = req.session.user._id;
    await Product.create(req.body);
    res.redirect("/products");
  } catch (error) {
    res.status(500).send("Error creating product");
  }
});

module.exports = router;
