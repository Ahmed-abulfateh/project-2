const User = require("../models/User");
const bcrypt = require("bcrypt");

// Admin: List users
async function getAllUsers(req, res) {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    const success = req.query.success || null;
    res.render("users/admin.ejs", { users, success, search });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get edit user page
async function getEditUser(req, res) {
  try {
    const managedUser = await User.findById(req.params.id);
    if (!managedUser) {
      return res.send("User not found");
    }
    res.render("users/edit.ejs", { managedUser });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Update user profile
async function updateUser(req, res) {
  try {
    const managedUser = await User.findById(req.params.id);
    if (!managedUser) {
      return res.send("User not found");
    }

    const { username, email, phone, bio, address, role, isEmailVerified } = req.body;

    if (email && email !== managedUser.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.send("Email already in use");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        username,
        email,
        phone,
        bio,
        address,
        role,
        isEmailVerified: isEmailVerified === "on",
      },
      { new: true, runValidators: true }
    );

    if (req.session.user && req.session.user._id.toString() === updatedUser._id.toString()) {
      req.session.user.username = updatedUser.username;
      req.session.user.email = updatedUser.email;
      req.session.user.role = updatedUser.role;
      req.session.user.isEmailVerified = updatedUser.isEmailVerified;
      req.session.user.address = updatedUser.address || "";
      req.session.user.phone = updatedUser.phone || "";
      req.session.user.bio = updatedUser.bio || "";
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.redirect("/users/admin?success=User updated");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Delete user (requires admin password)
async function deleteUser(req, res) {
  try {
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.send("Admin password is required");
    }

    const adminUser = await User.findById(req.session.user._id);
    if (!adminUser) {
      return res.send("Admin user not found");
    }

    const validPassword = bcrypt.compareSync(adminPassword, adminUser.password);
    if (!validPassword) {
      return res.send("Invalid admin password");
    }

    if (req.session.user._id.toString() === req.params.id) {
      return res.send("You cannot delete your own account");
    }

    const managedUser = await User.findById(req.params.id);
    if (!managedUser) {
      return res.send("User not found");
    }

    await User.findByIdAndDelete(req.params.id);
    res.redirect("/users/admin?success=User deleted");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  getAllUsers,
  getEditUser,
  updateUser,
  deleteUser,
};
