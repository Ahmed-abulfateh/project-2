module.exports = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin" && req.session.user.username === "Ahmed") {
    next();
  } else {
    res.send("Access Denied: Only Ahmed can manage users");
  }
};
