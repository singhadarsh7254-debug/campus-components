import Razorpay from "razorpay";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      amount,
      listingId,
      productName,
      buyerEmail,
      sellerUid
    } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    if (!listingId) {
      return res.status(400).json({
        error: "Listing ID is required"
      });
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error:
          "Razorpay configuration is missing on server."
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const amountInPaise =
      Math.round(Number(amount) * 100);

    const order =
      await razorpay.orders.create({

        amount: amountInPaise,

        currency: "INR",

        receipt:
          `cc_${String(listingId).slice(0,20)}_${Date.now()}`,

        notes: {

          listingId:
            String(listingId),

          productName:
            String(
              productName || "Campus Component"
            ).slice(0,200),

          buyerEmail:
            String(
              buyerEmail || ""
            ).slice(0,200),

          sellerUid:
            String(
              sellerUid || ""
            ).slice(0,200)

        }

      });

    return res.status(200).json({

      success: true,

      orderId:
        order.id,

      amount:
        order.amount,

      currency:
        order.currency

    });

  } catch (error) {

    console.error(
      "Razorpay order creation failed:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.error?.description ||
        error?.message ||
        "Failed to create Razorpay order."

    });

  }

}
