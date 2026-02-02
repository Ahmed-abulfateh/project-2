const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, verificationLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification - Confirm Your Account",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Welcome to Our Store!</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Thank you for creating an account. Please verify your email to get started.</p>
          
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0;">
            Verify Email Address
          </a>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link in your browser:<br>
            <span style="word-break: break-all;">${verificationLink}</span>
          </p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            This verification link expires in 24 hours.<br>
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendOrderConfirmationEmail = async (email, orderDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmation - Order ID: ${orderDetails.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 15px;">Order Confirmed!</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Thank you for your order.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p><strong>Total Price:</strong> $${orderDetails.totalPrice}</p>
            <p><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
          </div>
          
          <p style="color: #666;">We'll notify you once your order is shipped.</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Password Reset Request</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">We received a request to reset your password. Click the link below to reset it.</p>
          
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link in your browser:<br>
            <span style="word-break: break-all;">${resetLink}</span>
          </p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            This reset link expires in 1 hour.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendEmailChangeVerification = async (email, changeLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your New Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Verify Your New Email</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Please verify your new email address by clicking the link below.</p>
          
          <a href="${changeLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0;">
            Verify New Email
          </a>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link in your browser:<br>
            <span style="word-break: break-all;">${changeLink}</span>
          </p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            This verification link expires in 24 hours.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendUsernameEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Username",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Your Username</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">You requested to retrieve your username.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 10px;">Your username is:</p>
            <p style="color: #007bff; font-size: 24px; font-weight: bold; margin: 0;">${username}</p>
          </div>
          
          <p style="color: #666;">You can now use this username to sign in to your account.</p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            If you didn't request this, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendOrderAcceptedEmail = async (email, orderDetails) => {
  const itemsList = orderDetails.items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Accepted - Order ID: ${orderDetails.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 15px;">✓ Your Order Has Been Accepted!</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Great news! Your order has been accepted and is being prepared for shipment.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDetails.orderDate}</p>
            <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
          </div>
          
          <h3 style="color: #333; margin-top: 20px;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                <td style="padding: 15px; text-align: right;">$${orderDetails.totalPrice}</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="color: #666; margin-top: 20px;">Your order will be shipped soon. You'll receive another email with tracking information once it's dispatched.</p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            Thank you for shopping with us!<br>
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendDeliveryStatusEmail = async (email, orderDetails) => {
  let statusMessage = '';
  let statusColor = '';
  let statusIcon = '';
  
  switch(orderDetails.deliveryStatus) {
    case 'in-transit':
      statusMessage = 'Your order is on its way!';
      statusColor = '#007bff';
      statusIcon = '🚚';
      break;
    case 'delivered':
      statusMessage = 'Your order has been delivered!';
      statusColor = '#28a745';
      statusIcon = '✓';
      break;
    case 'not-shipped':
      statusMessage = 'Your order is being prepared';
      statusColor = '#6c757d';
      statusIcon = '📦';
      break;
    default:
      statusMessage = 'Order status updated';
      statusColor = '#6c757d';
      statusIcon = 'ℹ';
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Delivery Update - Order ID: ${orderDetails.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: ${statusColor}; margin-bottom: 15px;">${statusIcon} ${statusMessage}</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Your order status has been updated.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p style="margin: 5px 0;"><strong>Delivery Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${orderDetails.deliveryStatus.toUpperCase().replace('-', ' ')}</span></p>
            <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
          </div>
          
          ${orderDetails.deliveryStatus === 'delivered' ? 
            `<div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <p style="color: #155724; margin: 0;">Thank you for your purchase! We hope you enjoy your order.</p>
            </div>` : 
            orderDetails.deliveryStatus === 'in-transit' ?
            `<p style="color: #666;">Your order is currently in transit and will be delivered soon to your address.</p>` :
            `<p style="color: #666;">We'll notify you once your order is shipped.</p>`
          }
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            Thank you for shopping with us!<br>
            If you have any questions about your delivery, please contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendOrderRejectedEmail = async (email, orderDetails) => {
  const itemsList = orderDetails.items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Rejected - Order ID: ${orderDetails.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 15px;">✗ Your Order Has Been Rejected</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Unfortunately, your order could not be processed and has been rejected. Stock has been restored and you can place a new order at any time.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
          </div>
          
          <h3 style="color: #333; margin-top: 20px;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                <td style="padding: 15px; text-align: right;">$${orderDetails.totalPrice}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">Please feel free to contact our support team if you have any questions about this rejection.</p>
          </div>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            We appreciate your interest in our store!<br>
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordChangeOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Change OTP",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Password Change Request</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">You requested to change your password. Use the OTP code below to proceed:</p>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
          </div>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            This OTP expires in 10 minutes.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail, sendPasswordResetEmail, sendEmailChangeVerification, sendUsernameEmail, sendOrderAcceptedEmail, sendDeliveryStatusEmail, sendOrderRejectedEmail, sendPasswordChangeOTP };
