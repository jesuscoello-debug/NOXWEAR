import { NextResponse } from "next/server";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env.local");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error obteniendo access token de PayPal:", data);
    throw new Error("No se pudo obtener el access token de PayPal");
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { cart } = await req.json();

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "El carrito esta vacio o invalido" },
        { status: 400 }
      );
    }

    const total = cart.reduce((acc: number, item: any) => {
      return acc + Number(item.price) * Number(item.qty);
    }, 0);

    const accessToken = await getPayPalAccessToken();

    const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
            description: "Compra en NOXWEAR",
          },
        ],
        application_context: {
          return_url: "http://localhost:3000/pago-exitoso",
          cancel_url: "http://localhost:3000/pago-cancelado",
        },
      }),
    });

    const data = await response.json();

    console.log("PayPal token status:", response.status);
    console.log("PayPal token response:", data);

    if (!response.ok) {
      console.error("Error creando orden PayPal:", data);
      return NextResponse.json(
        { error: "No se pudo crear la orden de PayPal", details: data },
        { status: 500 }
      );
    }

    const approvalUrl = data.links?.find((link: any) => link.rel === "approve")?.href;

    return NextResponse.json({ approvalUrl });
  } catch (error: any) {
    console.error("Error interno:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}