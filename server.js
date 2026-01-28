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
const methodOverride = require('method-override')

// Middleware
app.use(express.static('public')) 
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'))
app.use(methodOverride('_method'))


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


app.use('/auth', authController)
app.use('/', indexController)


app.use(isSignedIn)
app.use('/cart', cartRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
