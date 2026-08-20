export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    const clientId =
      process.env.CASHFREE_CLIENT_ID;

    const clientSecret =
      process.env.CASHFREE_CLIENT_SECRET;


    if (!clientId || !clientSecret) {

      return res.status(500).json({
        error:
          "Cashfree environment variables are missing."
      });

    }


    const {
      amount,
      listingId,
      productName,
      buyerEmail,
      buyerUid,
      sellerUid
    } = req.body || {};


    const orderAmount =
      Number(amount);


    if (
      !Number.isFinite(orderAmount) ||
      orderAmount <= 0
    ) {

      return res.status(400).json({
        error:
          "Invalid payment amount."
      });

    }


    if (!buyerEmail) {

      return res.status(400).json({
        error:
          "Buyer email is required."
      });

    }


    if (!buyerUid) {

      return res.status(400).json({
        error:
          "Buyer UID is required."
      });

    }


    if (!listingId) {

      return res.status(400).json({
        error:
          "Listing ID is required."
      });

    }


    if (!sellerUid) {

      return res.status(400).json({
        error:
          "Seller UID is required."
      });

    }


    const orderId =
      "CC_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 9);


    const response =
      await fetch(
        "https://api.cashfree.com/pg/orders",
        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json",

            "x-client-id":
              clientId,

            "x-client-secret":
              clientSecret,

            "x-api-version":
              "2025-01-01"

          },

          body:JSON.stringify({

            order_id:
              orderId,

            order_amount:
              Number(
                orderAmount.toFixed(2)
              ),

            order_currency:
              "INR",

            customer_details:{

              customer_id:
                String(buyerUid),

              customer_email:
                buyerEmail,

              customer_phone:
                "9999999999"

            },

            order_meta:{

              return_url:
                "https://campus-components.vercel.app/?order_id={order_id}"

            },

            order_note:
              productName
                ?`Campus Components - ${productName}`
                :"Campus Components purchase",

            order_tags:{

              listing_id:
                String(listingId),

              buyer_uid:
                String(buyerUid),

              seller_uid:
                String(sellerUid)

            }

          })

        }
      );


    const data =
      await response.json();


    console.log(
      "Cashfree create order:",
      data
    );


    if (!response.ok) {

      return res.status(
        response.status
      ).json({

        error:
          data.message ||
          data.error_description ||
          "Cashfree order creation failed.",

        details:
          data

      });

    }


    if (
      !data.payment_session_id
    ) {

      return res.status(500).json({

        error:
          "Cashfree payment session was not received.",

        details:
          data

      });

    }


    return res.status(200).json({

      success:true,

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
        listingId,

      productName:
        productName || ""

    });


  } catch(error) {

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
