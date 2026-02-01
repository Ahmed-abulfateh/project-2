const User = require("../models/User");
const Product = require("../models/Product");

// Get user's wishlist
async function getWishlist(req, res) {
  try {
    const user = await User.findById(req.session.user._id).populate("wishlist");
    res.render("wishlist/index.ejs", { 
      wishlistItems: user.wishlist || [],
      user
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Add product to wishlist
async function addToWishlist(req, res) {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.session.user._id);

    // Check if product already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Product already in wishlist" 
      });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.json({ 
      success: true, 
      message: "Product added to wishlist",
      wishlistCount: user.wishlist.length
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding to wishlist" 
    });
  }
}

// Remove product from wishlist
async function removeFromWishlist(req, res) {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.session.user._id);

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({ 
      success: true, 
      message: "Product removed from wishlist",
      wishlistCount: user.wishlist.length
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      message: "Error removing from wishlist" 
    });
  }
}

// Check if product is in wishlist (AJAX)
async function checkWishlist(req, res) {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.session.user._id);
    const isInWishlist = user.wishlist.includes(productId);

    res.json({ 
      success: true, 
      isInWishlist,
      wishlistCount: user.wishlist.length
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false, 
      message: "Error checking wishlist" 
    });
  }
}

// Clear wishlist
async function clearWishlist(req, res) {
  try {
    await User.findByIdAndUpdate(
      req.session.user._id,
      { wishlist: [] }
    );

    res.redirect("/wishlist?success=Wishlist cleared");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist
};
