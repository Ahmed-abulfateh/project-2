// imports
const express = require("express") //importing express package
const app = express() // creates a express application
const dotenv = require("dotenv").config() //this allows me to use my .env values in this file
const mongoose = require("mongoose")
const morgan = require('morgan')
const authController = require("./controllers/auth.js");
const indexController = require("./controllers/index.routes.js");
const productsRoutes = require("./controllers/products.routes.js");
const ordersRoutes = require("./controllers/orders.routes.js");
const cartRoutes = require("./controllers/cart.routes.js");
const profileRoutes = require("./controllers/profile.routes.js");
const wishlistRoutes = require("./controllers/wishlist.routes.js");
const couponsRoutes = require("./controllers/coupons.routes.js");
const usersRoutes = require("./controllers/users.routes.js");
const session = require('express-session');
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");
const cartMiddleware = require("./middleware/cart.js");
const methodOverride = require('method-override');

// Security Middleware - Set secure headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Rate limiting for auth routes
const authAttempts = new Map();
const AUTH_LIMIT = 20;
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!authAttempts.has(ip)) {
    authAttempts.set(ip, []);
  }
  
  const attempts = authAttempts.get(ip);
  const recentAttempts = attempts.filter(time => now - time < AUTH_WINDOW);
  
  if (recentAttempts.length >= AUTH_LIMIT) {
    return res.status(429).send('Too many attempts. Please try again later. <a href="/">Back</a>');
  }
  
  recentAttempts.push(now);
  authAttempts.set(ip, recentAttempts);
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, times] of authAttempts.entries()) {
      const filtered = times.filter(time => now - time < AUTH_WINDOW);
      if (filtered.length === 0) {
        authAttempts.delete(key);
      } else {
        authAttempts.set(key, filtered);
      }
    }
  }
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

// Middleware
app.use(express.static('public')) 
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeInput);
app.use(morgan('dev'))
app.use(methodOverride('_method'))


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  })
);


app.use(passUserToView)
app.use(cartMiddleware)

app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;
const { MONGODB_URI } = process.env;

async function startServer() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set in the environment. Add it to your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to Database");

    app.listen(PORT, () => {
      console.log(`App is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();


app.use('/auth/sign-in', rateLimiter);
app.use('/auth/sign-up', rateLimiter);
app.use('/auth', authController)
app.use('/', indexController)


app.use(isSignedIn)
app.use('/profile', profileRoutes);
app.use('/wishlist', wishlistRoutes);
  app.use('/coupons', couponsRoutes);
  app.use('/cart', cartRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/users', usersRoutes);
