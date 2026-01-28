const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/email.js");


// Sign up routes
router.get("/sign-up", (req, res) => {
  res.render("auth/sign-up.ejs");
});

router.post("/sign-up", async (req, res) => {
  const userInDatabase = await User.findOne({ username: req.body.username });
  if (userInDatabase) {
    return res.send("Username already taken.");
  }

  if (req.body.password !== req.body.confirmPassword) {
    return res.send("Password and Confirm Password must match");
  }

  // Limit admin accounts to 2
  if (req.body.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 2) {
      return res.send("Maximum of 2 admin accounts allowed.");
    }
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  req.body.password = hashedPassword;

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  req.body.verificationToken = verificationToken;
  req.body.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create(req.body);

  // Send verification email
  try {
    const verificationLink = `${process.env.BASE_URL}/auth/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, verificationLink);
    res.send("Account created! Please check your email to verify your account. <a href='/auth/sign-in'>Back to Sign In</a>");
  } catch (error) {
    console.log("Email sending error:", error);
    res.send("Account created but email verification failed. Please try again later. <a href='/auth/sign-in'>Back to Sign In</a>");
  }
});



// Sign in routes
router.get("/sign-in", (req, res) => {
  res.render("auth/sign-in.ejs");
});



router.post("/sign-in", async (req, res) => {
  // First, get the user from the database
  const userInDatabase = await User.findOne({ username: req.body.username });
  if (!userInDatabase) {
    return res.send("Login failed. Please try again.");
  }

  // Check if email is verified
  if (!userInDatabase.isEmailVerified) {
    return res.send("Please verify your email before signing in. Check your email for verification link. <a href='/auth/sign-in'>Back to Sign In</a>");
  }

  // There is a user! Time to test their password with bcrypt
  const validPassword = bcrypt.compareSync(
    req.body.password,
    userInDatabase.password
  );
  if (!validPassword) {
    return res.send("Login failed. Please try again.");
  }

  // There is a user AND they had the correct password. Time to make a session!
  // Avoid storing the password, even in hashed format, in the session
  // If there is other data you want to save to `req.session.user`, do so here!
  req.session.user = {
    username: userInDatabase.username,
    email: userInDatabase.email,
    role: userInDatabase.role,
    _id: userInDatabase._id
  };

  res.redirect("/");
});


router.get("/sign-out", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Email verification route
router.get("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.send("Invalid or expired verification token. <a href='/auth/sign-up'>Create new account</a>");
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.send("Email verified successfully! <a href='/auth/sign-in'>Sign in to your account</a>");
  } catch (error) {
    console.log(error);
    res.send("Verification failed. Please try again. <a href='/auth/sign-up'>Create new account</a>");
  }
});

module.exports = router;
