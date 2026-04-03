import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { cart, total, customer } = await req.json();

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Carrito vacio o invalido" },
        { status: 400 }
      );
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const to = process.env.WHATSAPP_TO;

    if (!token || !phoneNumberId || !to) {
      return NextResponse.json(
        { error: "Faltan variables de WhatsApp en .env.local" },
        { status: 500 }
      );
    }

    const productosTexto = cart
      .map(
        (item: any) =>
          `- ${item.name} x${item.qty} = $${(
            Number(item.price) * Number(item.qty)
          ).toFixed(2)}`
      )
      .join("\n");

    const mensaje =
      `Pago confirmado en NOXWEAR\n\n` +
      `Pedido:\n${productosTexto}\n\n` +
      `Total: $${Number(total).toFixed(2)}\n` +
      `Cliente: ${customer || "No especificado"}`;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: mensaje,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error enviando WhatsApp:", data);
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje de WhatsApp", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("Error interno en send-whatsapp:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}