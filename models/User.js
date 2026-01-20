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
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
