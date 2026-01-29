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
const session = require('express-session');
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");
const cartMiddleware = require("./middleware/cart.js");
const methodOverride = require('method-override');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Middleware
app.use(express.static('public')) 
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'))
app.use(methodOverride('_method'))

// Security Middleware
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting for general routes
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again later.'
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
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


app.use('/auth/sign-in', authLimiter);
app.use('/auth/sign-up', authLimiter);
app.use('/auth', authController)
app.use('/', indexController)


app.use(isSignedIn)
app.use('/cart', cartRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
