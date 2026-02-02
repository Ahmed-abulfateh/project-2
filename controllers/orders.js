const Order = require("../models/Order");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const User = require("../models/User");
const { sendOrderAcceptedEmail, sendDeliveryStatusEmail, sendOrderConfirmationEmail, sendOrderRejectedEmail } = require("../utils/email");
const { incrementCouponUsage } = require("./coupons");

// Customer: Create new order from cart
async function createOrder(req, res) {
  try {
    const { deliveryAddress, appliedCoupon, discountAmount } = req.body;
    
    // Check if cart is empty
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.send("Cart is empty. Please add items before checkout.");
    }

    let totalPrice = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const cartItem of req.session.cart) {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        return res.send("Product not found");
      }
      if (product.stock < cartItem.quantity) {
        return res.send(`Insufficient stock for ${product.name}`);
      }
      
      orderItems.push({
        product: cartItem.productId,
        quantity: cartItem.quantity,
        price: product.price,
      });

      totalPrice += product.price * cartItem.quantity;
    }

    // Apply coupon discount if present
    const discount = parseFloat(discountAmount) || 0;
    const finalTotal = totalPrice - discount;

    const newOrder = new Order({
      customer: req.session.user._id,
      items: orderItems,
      totalPrice: finalTotal,
      couponCode: appliedCoupon || null,
      discountAmount: discount,
      deliveryAddress,
    });

    await newOrder.save();

    // Increment coupon usage if a coupon was applied
    if (appliedCoupon) {
      await incrementCouponUsage(appliedCoupon);
    }

    // Send order confirmation email to customer
    try {
      const customerEmail = req.session.user?.email;
      if (customerEmail) {
        await sendOrderConfirmationEmail(customerEmail, {
          orderId: newOrder._id,
          totalPrice: newOrder.totalPrice.toFixed(2),
          deliveryAddress: newOrder.deliveryAddress,
        });
      }
    } catch (emailError) {
      console.log("Failed to send order confirmation email:", emailError);
      // Continue even if email fails
    }

    // Clear cart after successful order
    req.session.cart = [];

    res.redirect("/orders");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Customer: Get their orders
async function getCustomerOrders(req, res) {
  try {
    const orders = await Order.find({ customer: req.session.user._id })
      .populate("items.product");
    res.render("orders/customer.ejs", { orders });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Customer: Get single order details
async function getOrderDetail(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    
    // Check if user is the order owner or an admin
    const isOwner = order.customer.toString() === req.session.user._id.toString();
    const isAdmin = req.session.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.send("Unauthorized");
    }

    res.render("orders/detail.ejs", { order });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Get all orders
async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate("customer")
      .populate("items.product");
    res.render("orders/admin.ejs", { orders });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Accept order
async function acceptOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer")
      .populate("items.product");
    
    // Update product stock and create history
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
      
      // Record stock change in history
      await StockHistory.create({
        product: item.product._id,
        quantity: -item.quantity,
        changeType: "customer-order",
        orderId: order._id,
        notes: `Order accepted by admin`,
      });
    }
    
    await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "accepted" },
      { new: true }
    );

    // Send email to customer
    try {
      await sendOrderAcceptedEmail(order.customer.email, {
        orderId: order._id,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        deliveryAddress: order.deliveryAddress,
        items: order.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: order.totalPrice.toFixed(2)
      });
    } catch (emailError) {
      console.log("Failed to send order acceptance email:", emailError);
      // Continue even if email fails
    }

    res.redirect("/orders/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Reject order
async function rejectOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer")
      .populate("items.product");
    
    // Restore stock and create history
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: item.quantity } }
      );
      
      // Record stock restoration in history
      await StockHistory.create({
        product: item.product._id,
        quantity: item.quantity,
        changeType: "order-rejected",
        adminId: req.session.user._id,
        orderId: order._id,
        notes: `Order rejected - stock restored`,
      });
    }

    await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "rejected" },
      { new: true }
    );
    
    // Send email to customer
    try {
      await sendOrderRejectedEmail(order.customer.email, {
        orderId: order._id,
        deliveryAddress: order.deliveryAddress,
        items: order.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: order.totalPrice.toFixed(2)
      });
    } catch (emailError) {
      console.log("Failed to send order rejection email:", emailError);
      // Continue even if email fails
    }
    
    res.redirect("/orders/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

// Admin: Update delivery status
async function updateDeliveryStatus(req, res) {
  try {
    const { deliveryStatus } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus },
      { new: true }
    ).populate("customer");

    // Send email to customer about delivery status change
    try {
      await sendDeliveryStatusEmail(order.customer.email, {
        orderId: order._id,
        deliveryStatus: order.deliveryStatus,
        deliveryAddress: order.deliveryAddress
      });
    } catch (emailError) {
      console.log("Failed to send delivery status email:", emailError);
      // Continue even if email fails
    }
    
    res.redirect("/orders/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderDetail,
  getAllOrders,
  acceptOrder,
  rejectOrder,
  updateDeliveryStatus,
};
