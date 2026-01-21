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
const session = require('express-session');
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");
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

app.set('view engine', 'ejs');

async function connectToDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Connected to Database")
    }
    catch(error){
        console.log("Error Occurred:", error)
    }
}

connectToDB() // connect to database


app.use('/auth', authController)
app.use('/', indexController)


app.use(isSignedIn)
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);

// Start server
app.listen(3000, () => {
    console.log('App is running on http://localhost:3000')
})
