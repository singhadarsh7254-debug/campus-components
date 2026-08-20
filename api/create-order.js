export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Cashfree production credentials
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: "Cashfree environment variables are missing."
      });
    }

    const {
      amount,
      listingId,
      productName,
      buyerEmail,
      sellerUid
    } = req.body || {};

    // Validate amount
    const orderAmount = Number(amount);

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        error: "Invalid payment amount."
      });
    }

    if (!buyerEmail) {
      return res.status(400).json({
        error: "Buyer email is required."
      });
    }

    // Generate unique order ID
    const orderId =
      "CC_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 8);

    // Production Cashfree API
    const cashfreeResponse = await fetch(
      "https://api.cashfree.com/pg/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "x-client-id":
            clientId,

          "x-client-secret":
            clientSecret,

          "x-api-version":
            "2025-01-01"
        },

        body: JSON.stringify({

          order_id:
            orderId,

          order_amount:
            orderAmount,

          order_currency:
            "INR",

          customer_details: {

            customer_id:
              "buyer_" +
              Date.now(),

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
            productName
              ? `Campus Components - ${productName}`
              : "Campus Components purchase",

          order_tags: {

            listing_id:
              String(listingId || ""),

            seller_uid:
              String(sellerUid || "")

          }

        })
      }
    );

    const data =
      await cashfreeResponse.json();

    console.log(
      "Cashfree response:",
      data
    );

    if (!cashfreeResponse.ok) {

      return res.status(
        cashfreeResponse.status
      ).json({

        error:
          data.message ||
          data.error_description ||
          "Cashfree order creation failed.",

        details:
          data

      });
    }

    // Payment session must exist
    if (!data.payment_session_id) {

      return res.status(500).json({

        error:
          "Cashfree payment session was not received.",

        details:
          data

      });
    }

    // Send required information to frontend
    return res.status(200).json({

      success:
        true,

      orderId:
        data.order_id ||
        orderId,

      paymentSessionId:
        data.payment_session_id,

      orderAmount:
        data.order_amount,

      orderCurrency:
        data.order_currency,

      listingId:
        listingId || "",

      productName:
        productName || ""

    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({

      error:
        error.message ||
        "Unable to create Cashfree order."

    });
  }
}
