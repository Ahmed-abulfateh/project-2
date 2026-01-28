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

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail };
