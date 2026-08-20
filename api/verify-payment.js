export default async function handler(req,res){

  if(req.method!=="POST"){

    return res.status(405).json({
      error:"Method not allowed"
    });

  }


  try{

    const {orderId}=req.body||{};


    if(!orderId){

      return res.status(400).json({
        error:"Order ID is required"
      });

    }


    const response=
      await fetch(
        "https://api.cashfree.com/pg/orders/"
        +encodeURIComponent(orderId),
        {

          method:"GET",

          headers:{

            "Content-Type":
              "application/json",

            "x-api-version":
              "2025-01-01",

            "x-client-id":
              process.env.CASHFREE_CLIENT_ID,

            "x-client-secret":
              process.env.CASHFREE_CLIENT_SECRET

          }

        }
      );


    const data=await response.json();


    if(!response.ok){

      console.error(
        "Cashfree verification:",
        data
      );

      return res.status(response.status).json({

        error:
          data.message ||
          data.error ||
          "Cashfree verification failed"

      });

    }


    const verified=
      data.order_status==="PAID";


    return res.status(200).json({

      verified:verified,

      orderStatus:
        data.order_status || "UNKNOWN",

      orderId:
        data.order_id || orderId,

      amount:
        data.order_amount || 0

    });


  }catch(error){

    console.error(error);

    return res.status(500).json({
      error:error.message
    });

  }

}
