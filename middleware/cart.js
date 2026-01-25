module.exports = (req, res, next) => {
  // Initialize cart in session if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  // Make cart available in views
  res.locals.cartItems = req.session.cart;
  res.locals.cartCount = req.session.cart.length;
  
  next();
};
