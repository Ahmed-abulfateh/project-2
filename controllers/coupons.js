const Coupon = require("../models/Coupon");
const Product = require("../models/Product");

// Admin: Get coupons management page
async function getCouponsManagement(req, res) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    const categories = await Product.distinct("category");
    
    res.render("coupons/admin.ejs", { coupons, categories });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Create new coupon
async function createCoupon(req, res) {
  try {
    const { code, discountType, discountValue, description, expiresAt, minOrderValue, maxUses, categories } = req.body;

    // Validate discount value
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return res.send("Percentage discount must be between 0 and 100");
    }

    if (discountType === "fixed" && discountValue < 0) {
      return res.send("Fixed discount must be positive");
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      description,
      expiresAt: new Date(expiresAt),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxUses: maxUses ? parseInt(maxUses) : null,
      categories: categories || [],
      createdBy: req.session.user._id
    });

    await newCoupon.save();
    res.redirect("/coupons?success=Coupon created successfully");
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.send("This coupon code already exists");
    }
    res.send(error);
  }
}

// Admin: Update coupon
async function updateCoupon(req, res) {
  try {
    const { code, discountType, discountValue, description, expiresAt, minOrderValue, maxUses, categories, isActive } = req.body;

    // Validate discount value
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return res.send("Percentage discount must be between 0 and 100");
    }

    if (discountType === "fixed" && discountValue < 0) {
      return res.send("Fixed discount must be positive");
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        description,
        expiresAt: new Date(expiresAt),
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        categories: categories || [],
        isActive: isActive === "on"
      },
      { new: true }
    );

    res.redirect("/coupons?success=Coupon updated successfully");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Delete coupon
async function deleteCoupon(req, res) {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.redirect("/coupons?success=Coupon deleted successfully");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get edit coupon page
async function getEditCoupon(req, res) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    const categories = await Product.distinct("category");
    
    res.render("coupons/edit.ejs", { coupon, categories });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Customer: Validate and apply coupon
async function validateCoupon(req, res) {
  try {
    const { code, orderTotal } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.json({ 
        valid: false, 
        message: "Coupon code not found" 
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.json({ 
        valid: false, 
        message: "This coupon is no longer active" 
      });
    }

    // Check expiration
    if (new Date() > coupon.expiresAt) {
      return res.json({ 
        valid: false, 
        message: "This coupon has expired" 
      });
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.json({ 
        valid: false, 
        message: "This coupon has reached its maximum usage limit" 
      });
    }

    // Check minimum order value
    if (orderTotal < coupon.minOrderValue) {
      return res.json({ 
        valid: false, 
        message: `Minimum order value of $${coupon.minOrderValue.toFixed(2)} required` 
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (orderTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    const finalTotal = Math.max(0, orderTotal - discount);

    res.json({
      valid: true,
      message: "Coupon applied successfully",
      discount: discount.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      valid: false, 
      message: "Error validating coupon" 
    });
  }
}

// Admin: Increment usage count
async function incrementCouponUsage(code) {
  try {
    await Coupon.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  } catch (error) {
    console.log("Error incrementing coupon usage:", error);
  }
}

module.exports = {
  getCouponsManagement,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getEditCoupon,
  validateCoupon,
  incrementCouponUsage
};
