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

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: "Cashfree environment variables are missing"
      });
    }

    const orderId =
      "CC_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 8);

    const customerId =
      buyerEmail
        ? buyerEmail.replace(/[^a-zA-Z0-9_-]/g, "_")
        : "customer_" + Date.now();

    const response = await fetch(
      "https://sandbox.cashfree.com/pg/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2025-01-01",
          "x-client-id": appId,
          "x-client-secret": secretKey
        },

        body: JSON.stringify({
          order_id: orderId,

          order_amount: Number(amount),

          order_currency: "INR",

          customer_details: {
            customer_id: customerId,
            customer_email: buyerEmail || "customer@example.com",
            customer_phone: "9999999999"
          },

          order_meta: {
  return_url:
    "https://campus-components.vercel.app/?order_id={order_id}"
},

          order_note:
            productName || "Campus Components Order",

          order_tags: {
            listingId: String(listingId || ""),
            sellerUid: String(sellerUid || "")
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree create order error:", data);

      return res.status(response.status).json({
        error:
          data.message ||
          data.error ||
          "Cashfree order creation failed",
        details: data
      });
    }

    return res.status(200).json({
      success: true,

      orderId:
        data.order_id || orderId,

      paymentSessionId:
        data.payment_session_id
    });

  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
