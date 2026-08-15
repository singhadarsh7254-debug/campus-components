const Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { amount, listingId } = req.body;

    const price = Number(amount);

    if (!Number.isFinite(price) || price < 1) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    if (!listingId) {
      return res.status(400).json({
        error: "Missing listingId"
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `cc_${Date.now()}`
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      listingId
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to create Razorpay order"
    });
  }
};
