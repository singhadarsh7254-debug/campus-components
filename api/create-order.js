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

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    if (!buyerEmail) {
      return res.status(400).json({
        error: "Buyer email is required"
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
      "cc_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 10);

    const customerId =
      "customer_" +
      Date.now();

    const customerPhone = "9999999999";

    const payload = {
      order_id: orderId,

      order_amount: Number(amount),

      order_currency: "INR",

      customer_details: {
        customer_id: customerId,

        customer_email: buyerEmail,

        customer_phone: customerPhone
      },

      order_meta: {
        return_url:
          "https://campus-components.vercel.app/?order_id={order_id}"
      },

      order_note:
        productName ||
        "CampusComponents order",

      order_tags: {
        listingId:
          String(listingId || ""),

        sellerUid:
          String(sellerUid || ""),

        productName:
          String(productName || "")
      }
    };

    const response = await fetch(
      "https://sandbox.cashfree.com/pg/orders",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "x-client-id":
            appId,

          "x-client-secret":
            secretKey,

          "x-api-version":
            "2025-01-01",

          "x-idempotency-key":
            orderId
        },

        body:
          JSON.stringify(payload)
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Cashfree create order error:",
        data
      );

      return res.status(response.status).json({
        error:
          data.message ||
          data.error ||
          "Cashfree order creation failed",

        details:
          data
      });
    }

    return res.status(200).json({
      success: true,

      orderId:
        data.order_id,

      paymentSessionId:
        data.payment_session_id,

      amount:
        Number(amount),

      currency:
        "INR"
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Internal server error"
    });
  }
}
