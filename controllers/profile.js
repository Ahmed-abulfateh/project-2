const User = require("../models/User");
const Order = require("../models/Order");

// Get user profile page
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("auth/profile.ejs", { user });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { username, phone, bio } = req.body;
    
    await User.findByIdAndUpdate(
      req.session.user._id,
      { username, phone, bio },
      { new: true }
    );

    req.session.user.username = username;
    req.session.user.phone = phone;
    req.session.user.bio = bio;

    res.redirect("/profile?success=Profile updated successfully");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Get user's order history
async function getOrderHistory(req, res) {
  try {
    const orders = await Order.find({ customer: req.session.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.render("auth/order-history.ejs", { orders });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Get saved addresses page
async function getSavedAddresses(req, res) {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("auth/saved-addresses.ejs", { addresses: user.savedAddresses || [] });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Add saved address
async function addAddress(req, res) {
  try {
    const { label, address, city, postalCode, isDefault } = req.body;
    
    if (!label || !address || !city || !postalCode) {
      return res.status(400).send("All fields are required");
    }

    const user = await User.findById(req.session.user._id);
    
    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    if (isDefault === "on") {
      user.savedAddresses.forEach(addr => addr.isDefault = false);
    }

    user.savedAddresses.push({
      label: label || "other",
      address,
      city,
      postalCode,
      isDefault: isDefault === "on"
    });

    await user.save();
    res.redirect("/profile/addresses?success=Address added");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Delete saved address
async function deleteAddress(req, res) {
  try {
    const addressId = req.params.addressId;
    
    await User.findByIdAndUpdate(
      req.session.user._id,
      { $pull: { savedAddresses: { _id: addressId } } }
    );

    res.redirect("/profile/addresses?success=Address deleted");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Set default address
async function setDefaultAddress(req, res) {
  try {
    const addressId = req.params.addressId;
    
    const user = await User.findById(req.session.user._id);
    
    user.savedAddresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();
    res.redirect("/profile/addresses?success=Default address updated");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getOrderHistory,
  getSavedAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
};
