export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        error: "Cashfree orderId is required"
      });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: "Cashfree environment variables are missing"
      });
    }

    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",

        headers: {
          "x-api-version": "2025-01-01",
          "x-client-id": appId,
          "x-client-secret": secretKey
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree verify error:", data);

      return res.status(response.status).json({
        verified: false,
        error:
          data.message ||
          data.error ||
          "Unable to verify Cashfree payment",
        details: data
      });
    }

    const verified =
      data.order_status === "PAID";

    return res.status(200).json({
      verified,
      orderId: data.order_id,
      orderStatus: data.order_status,
      paymentDetails: data
    });

  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      verified: false,
      error: error.message || "Internal server error"
    });
  }
}
