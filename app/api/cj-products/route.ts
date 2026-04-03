export async function GET() {
  const apiKey = process.env.CJ_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        message: "Falta CJ_API_KEY en .env.local",
      },
      { status: 500 }
    );
  }

  try {
    const tokenRes = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
        cache: "no-store",
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData?.data?.accessToken) {
      return Response.json(
        {
          ok: false,
          message: "No se pudo obtener el token",
          cjResponse: tokenData,
          statusFromCJ: tokenRes.status,
        },
        { status: 500 }
      );
    }

    const accessToken = tokenData.data.accessToken;

    const productRes = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/product/list",
      {
        method: "GET",
        headers: {
          "CJ-Access-Token": accessToken,
        },
        cache: "no-store",
      }
    );

    const productData = await productRes.json();
    const list = productData?.data?.list || [];

    const transformed = list.map((item: any, index: number) => ({
      id: index + 1,
      name: item?.productName || "Producto CJ",
      price: Number(item?.sellPrice) || 20,
      image: item?.productImage || "",
      category: "Dropshipping",
      description: "Producto premium disponible en NOXWEAR.",
    }));

    return Response.json({
      ok: true,
      products: transformed,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: "Error al obtener productos",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}