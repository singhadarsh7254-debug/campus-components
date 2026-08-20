export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    console.log("Cashfree App ID exists:", !!appId);
    console.log("Cashfree Secret Key exists:", !!secretKey);

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: "Cashfree environment variables are missing"
      });
    }

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

    const orderId =
      "cc_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 8);

    const payload = {
      order_id: orderId,

      order_amount: Number(amount),

      order_currency: "INR",

      customer_details: {
        customer_id:
          "cc_user_" + Date.now(),

        customer_email:
          buyerEmail,

        customer_phone:
          "9999999999"
      },

      order_meta: {
        return_url:
          "https://campus-components.vercel.app/?order_id={order_id}"
      },

      order_note:
        productName ||
        "CampusComponents Order"
    };

    const response = await fetch(
      "https://api.cashfree.com/pg/orders",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "x-api-version":
            "2025-01-01",

          "x-client-id":
            appId,

          "x-client-secret":
            secretKey
        },

        body:
          JSON.stringify(payload)
      }
    );

    const data =
      await response.json();

    console.log(
      "Cashfree response:",
      data
    );

    if (!response.ok) {
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
