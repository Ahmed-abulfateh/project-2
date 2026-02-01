const Product = require("../models/Product");

// Add item to cart
async function addToCart(req, res) {
  try {
    const { productId, quantity, size, color } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.send("Product not found");
    }

    // Check if product has variants and variant info is required
    let availableStock = product.stock;
    if (product.hasVariants && product.variants.length > 0) {
      // Find matching variant
      const variant = product.variants.find(v => 
        v.size === (size || null) && v.color === (color || null)
      );
      
      if (!variant) {
        return res.send("Selected variant not found");
      }
      
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return res.send("Insufficient stock");
    }

    // Create unique identifier for cart item (includes variant info)
    const variantKey = product.hasVariants ? `${size || ''}|${color || ''}` : '';
    const cartItemIndex = req.session.cart.findIndex(
      item => item.productId === productId && item.variantKey === variantKey
    );

    if (cartItemIndex > -1) {
      // Update quantity if already in cart
      req.session.cart[cartItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      const cartItem = {
        productId,
        quantity: parseInt(quantity),
        price: product.price,
        name: product.name,
        variantKey,
      };
      
      if (product.hasVariants) {
        cartItem.size = size || null;
        cartItem.color = color || null;
      }
      
      req.session.cart.push(cartItem);
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// View cart
async function viewCart(req, res) {
  try {
    let cartItems = [];
    let totalPrice = 0;

    // Get full product details for cart items
    for (const item of req.session.cart) {
      const product = await Product.findById(item.productId);
      if (product) {
        cartItems.push({
          ...item,
          product,
        });
        totalPrice += item.price * item.quantity;
      }
    }

    res.render("cart/index.ejs", { cartItems, totalPrice });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Update cart item quantity
async function updateCartItem(req, res) {
  try {
    const { productId, quantity } = req.body;
    const newQuantity = parseInt(quantity);

    // Validate stock
    const product = await Product.findById(productId);
    if (!product || product.stock < newQuantity) {
      return res.send("Insufficient stock");
    }

    // Update quantity
    const cartItem = req.session.cart.find(item => item.productId === productId);
    if (cartItem) {
      cartItem.quantity = newQuantity;
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Remove item from cart
function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    req.session.cart = req.session.cart.filter(
      item => item.productId !== productId
    );
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Clear cart
function clearCart(req, res) {
  try {
    req.session.cart = [];
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  addToCart,
  viewCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
