const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["admin", "customer"],
    default: "customer",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  emailChangeToken: {
    type: String,
    default: null,
  },
  emailChangeTokenExpires: {
    type: Date,
    default: null,
  },
  newEmail: {
    type: String,
    default: null,
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
