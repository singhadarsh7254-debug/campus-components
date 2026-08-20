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
      orderId
    } = req.body || {};


    if (!orderId) {

      return res.status(400).json({
        error:
          "Cashfree order ID is required."
      });

    }


    const response =
      await fetch(
        `https://api.cashfree.com/pg/orders/${encodeURIComponent(orderId)}`,
        {

          method:"GET",

          headers:{

            "x-client-id":
              clientId,

            "x-client-secret":
              clientSecret,

            "x-api-version":
              "2025-01-01",

            "Content-Type":
              "application/json"

          }

        }
      );


    const data =
      await response.json();


    console.log(
      "Cashfree verify response:",
      data
    );


    if (!response.ok) {

      return res.status(
        response.status
      ).json({

        verified:false,

        error:
          data.message ||
          data.error_description ||
          "Cashfree payment verification failed.",

        details:
          data

      });

    }


    const status =
      String(
        data.order_status || ""
      ).toUpperCase();


    const verified =
      status === "PAID";


    return res.status(200).json({

      verified:

        verified,

      orderId:

        data.order_id ||
        orderId,

      orderStatus:

        data.order_status || "",

      amount:

        data.order_amount || null,

      currency:

        data.order_currency || "INR"

    });


  } catch(error) {

    console.error(
      "Verify payment error:",
      error
    );


    return res.status(500).json({

      verified:false,

      error:
        error.message ||
        "Unable to verify payment."

    });

  }

}
