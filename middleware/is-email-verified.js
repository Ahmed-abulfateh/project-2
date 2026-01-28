const isEmailVerified = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/sign-in");
  }

  if (!req.session.user.isEmailVerified) {
    return res.send(
      "Please verify your email before placing an order. " +
      "Check your email for the verification link sent during sign-up. " +
      "<a href='/auth/change-email'>Didn't receive it? Click here to change email</a> or " +
      "<a href='/orders'>Go Back</a>"
    );
  }

  next();
};

module.exports = isEmailVerified;
