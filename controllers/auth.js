const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail, sendEmailChangeVerification, sendUsernameEmail } = require("../utils/email.js");


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
    _id: userInDatabase._id,
    isEmailVerified: userInDatabase.isEmailVerified
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

// Forgot Password - Request
router.get("/forgot-password", (req, res) => {
  res.render("auth/forgot-password.ejs");
});

router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.send("If an account with that email exists, a password reset link has been sent. <a href='/auth/sign-in'>Back to Sign In</a>");
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    try {
      const resetLink = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
      await sendPasswordResetEmail(user.email, resetLink);
      res.send("Password reset link has been sent to your email. <a href='/auth/sign-in'>Back to Sign In</a>");
    } catch (error) {
      console.log("Email sending error:", error);
      res.send("Error sending reset email. Please try again later. <a href='/auth/forgot-password'>Try Again</a>");
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred. Please try again. <a href='/auth/forgot-password'>Try Again</a>");
  }
});

// Reset Password
router.get("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.send("Invalid or expired reset token. <a href='/auth/forgot-password'>Request new link</a>");
    }

    res.render("auth/reset-password.ejs", { token: req.params.token });
  } catch (error) {
    console.log(error);
    res.send("Error loading reset page. <a href='/auth/forgot-password'>Try Again</a>");
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.send("Passwords do not match. <a href='/auth/reset-password/" + req.params.token + "'>Try Again</a>");
    }

    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.send("Invalid or expired reset token. <a href='/auth/forgot-password'>Request new link</a>");
    }

    // Update password
    const hashedPassword = bcrypt.hashSync(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.send("Password reset successfully! <a href='/auth/sign-in'>Sign in</a>");
  } catch (error) {
    console.log(error);
    res.send("Error resetting password. Please try again. <a href='/auth/forgot-password'>Request new link</a>");
  }
});

// Forgot Username
router.get("/forgot-username", (req, res) => {
  res.render("auth/forgot-username.ejs");
});

router.post("/forgot-username", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.send("If an account with that email exists, the username has been sent. <a href='/auth/sign-in'>Back to Sign In</a>");
    }

    // Send username email
    try {
      await sendUsernameEmail(user.email, user.username);
      res.send("Username has been sent to your email. <a href='/auth/sign-in'>Back to Sign In</a>");
    } catch (error) {
      console.log("Email sending error:", error);
      res.send("Error sending email. Please try again later. <a href='/auth/forgot-username'>Try Again</a>");
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred. Please try again. <a href='/auth/forgot-username'>Try Again</a>");
  }
});

// Change Email
router.get("/change-email", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/sign-in");
  }
  if (req.session.user.isEmailVerified) {
    return res.send("You cannot change your email address once it has been verified. <a href='/'>Back to Home</a>");
  }
  res.render("auth/change-email.ejs", { user: req.session.user });
});

router.post("/change-email", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/sign-in");
    }

    // Prevent email change if already verified
    if (req.session.user.isEmailVerified) {
      return res.send("You cannot change your email address once it has been verified. <a href='/'>Back to Home</a>");
    }

    const { newEmail } = req.body;
    const user = await User.findById(req.session.user._id);

    // Check if new email is already taken
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.send("Email already in use. <a href='/'>Back</a>");
    }

    // Generate email change token
    const changeToken = crypto.randomBytes(32).toString("hex");
    user.emailChangeToken = changeToken;
    user.emailChangeTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    user.newEmail = newEmail;
    await user.save();

    // Send verification email to new email address
    try {
      const changeLink = `${process.env.BASE_URL}/auth/verify-email-change/${changeToken}`;
      await sendEmailChangeVerification(newEmail, changeLink);
      res.send("Verification link sent to your new email address. Please verify within 24 hours. <a href='/'>Back</a>");
    } catch (error) {
      console.log("Email sending error:", error);
      res.send("Error sending verification email. Please try again. <a href='/auth/change-email'>Try Again</a>");
    }
  } catch (error) {
    console.log(error);
    res.send("Error requesting email change. Please try again. <a href='/auth/change-email'>Try Again</a>");
  }
});

// Verify Email Change
router.get("/verify-email-change/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      emailChangeToken: req.params.token,
      emailChangeTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.send("Invalid or expired email change token. <a href='/auth/change-email'>Request new link</a>");
    }

    // Update email
    user.email = user.newEmail;
    user.isEmailVerified = true;
    user.emailChangeToken = null;
    user.emailChangeTokenExpires = null;
    user.newEmail = null;
    await user.save();

    // Update session
    req.session.user.email = user.email;
    req.session.user.isEmailVerified = true;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.send("Email changed successfully! <a href='/'>Back to Home</a>");
  } catch (error) {
    console.log(error);
    res.send("Error changing email. Please try again. <a href='/auth/change-email'>Request new link</a>");
  }
});

// Address Profile Routes
router.get("/address-profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/sign-in");
  }
  res.render("auth/address-profile.ejs");
});

router.post("/address-profile", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/sign-in");
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.send("User not found. <a href='/auth/sign-in'>Sign In</a>");
    }

    user.address = req.body.address;
    await user.save();

    // Update session
    req.session.user.address = user.address;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.send("Address saved successfully! <a href='/'>Back to Home</a>");
  } catch (error) {
    console.log(error);
    res.send("Error saving address. Please try again. <a href='/auth/address-profile'>Back</a>");
  }
});

module.exports = router;
