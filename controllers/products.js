const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Review = require("../models/Review");

// Admin: Create a new product
async function createProduct(req, res) {
  try {
    const { name, description, price, stock, imageUrl, category } = req.body;
    
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      category: category || "Other",
      imageUrl: imageUrl || "https://via.placeholder.com/400x300?text=No+Image",
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
    const { 
      category, 
      minPrice, 
      maxPrice, 
      minRating,
      search,
      inStock,
      sortBy,
      page = 1,
      pageSize = 12
    } = req.query;
    
    const filter = {};
    
    // Category filter
    if (category && category !== "All") {
      filter.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Stock availability filter
    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }
    
    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    // Determine sort order
    let sortOptions = { createdAt: -1 }; // default: newest first
    if (sortBy === "price-asc") {
      sortOptions = { price: 1 };
    } else if (sortBy === "price-desc") {
      sortOptions = { price: -1 };
    } else if (sortBy === "name") {
      sortOptions = { name: 1 };
    }
    
    // Count total products for pagination
    const totalCount = await Product.countDocuments(filter);
    const pageNum = Math.max(1, parseInt(page));
    const size = Math.min(Math.max(1, parseInt(pageSize)), 48); // min 1, max 48
    const skip = (pageNum - 1) * size;
    const totalPages = Math.ceil(totalCount / size);
    
    // Get products with pagination
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(size);
    
    // Get average rating for each product
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const reviews = await Review.find({ product: product._id });
        const avgRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : 0;
        
        // Filter by minimum rating if specified
        if (minRating && parseFloat(avgRating) < parseFloat(minRating)) {
          return null;
        }
        
        return {
          ...product.toObject(),
          avgRating,
          reviewCount: reviews.length
        };
      })
    );
    
    // Filter out null values (products below min rating)
    const filteredProducts = enrichedProducts.filter(p => p !== null);
    
    const categories = await Product.distinct("category");
    
    res.render("products/index.ejs", { 
      products: filteredProducts, 
      categories, 
      selectedCategory: category || "All",
      filters: {
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        minRating: minRating || "",
        search: search || "",
        inStock: inStock === "true",
        sortBy: sortBy || "newest"
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        pageSize: size,
        totalCount: filteredProducts.length,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get all products with edit/delete options
async function getAdminProducts(req, res) {
  try {
    const { name, category } = req.query;
    const filter = {};

    if (name && name.trim()) {
      filter.name = { $regex: name.trim(), $options: "i" };
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const [products, categories] = await Promise.all([
      Product.find(filter),
      Product.distinct("category"),
    ]);

    res.render("products/admin.ejs", {
      products,
      categories,
      selectedName: name || "",
      selectedCategory: category || "All",
    });
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
    const { name, description, price, stock, imageUrl, category } = req.body;
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
      { name, description, price, stock, imageUrl, category },
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

// Admin: Get variants management page
async function getVariantsManagement(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    res.render("products/variants.ejs", { product });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Add variant to product
async function addVariant(req, res) {
  try {
    const { size, color, sku, stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    // Check if variant already exists
    const existingVariant = product.variants.find(v => v.size === size && v.color === color);
    if (existingVariant) {
      return res.send("This variant combination already exists");
    }

    product.hasVariants = true;
    product.variants.push({
      size: size || null,
      color: color || null,
      sku,
      stock: parseInt(stock)
    });

    await product.save();
    res.redirect(`/products/${req.params.id}/variants`);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Delete variant from product
async function deleteVariant(req, res) {
  try {
    const { variantId } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $pull: { variants: { _id: variantId } } },
      { new: true }
    );

    // If no variants left, set hasVariants to false
    if (product.variants.length === 0) {
      product.hasVariants = false;
      await product.save();
    }

    res.redirect(`/products/${req.params.id}/variants`);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Update variant
async function updateVariant(req, res) {
  try {
    const { variantId } = req.params;
    const { size, color, sku, stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    const variant = product.variants.id(variantId);
    
    if (!variant) {
      return res.send("Variant not found");
    }

    variant.size = size || null;
    variant.color = color || null;
    variant.sku = sku;
    variant.stock = parseInt(stock);

    await product.save();
    res.redirect(`/products/${req.params.id}/variants`);
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
  getVariantsManagement,
  addVariant,
  deleteVariant,
  updateVariant,
};
