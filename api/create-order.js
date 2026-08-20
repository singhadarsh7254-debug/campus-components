export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      listingId,
      productName,
      buyerEmail,
      buyerUid,
      sellerUid
    } = req.body;

    if (!amount || !buyerEmail || !buyerUid || !sellerUid) {
      return res.status(400).json({
        error: "Missing required order details"
      });
    }

    const orderId =
      "CC_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 8);

    const response = await fetch(
      "https://api.cashfree.com/pg/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2025-01-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET
        },

        body: JSON.stringify({
          order_id: orderId,

          order_amount: Number(amount),

          order_currency: "INR",

          customer_details: {
            customer_id: buyerUid,
            customer_email: buyerEmail,
            customer_phone: "9999999999"
          },

          order_meta: {
            return_url:
              "https://campus-components.vercel.app/?order_id={order_id}"
          },

          order_note:
            productName || "Campus Components",

          order_tags: {
            listing_id: String(listingId || ""),
            seller_uid: String(sellerUid || ""),
            buyer_uid: String(buyerUid || "")
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree create order:", data);

      return res.status(response.status).json({
        error:
          data.message ||
          data.error ||
          "Cashfree order creation failed"
      });
    }

    return res.status(200).json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
