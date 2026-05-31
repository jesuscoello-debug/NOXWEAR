"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./api/cj-products/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category?: string;
  image: string;
  images?: string[];
  description?: string;
};

type CartItem = Product & {
  qty: number;
  size: string;
};

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todo");
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImage, setSelectedImage] = useState("");


  useEffect(() => {
    const savedCart = localStorage.getItem("noxwear-cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("noxwear-cart", JSON.stringify(cart));
  }, [cart]);


useEffect(() => {
  const loadProducts = async () => {
    console.log("ENTRO A SUPABASE");

    const { data, error } = await supabase
      .from("products")
      .select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
      setLoading(false);
      return;
    }

    const formattedProducts = (data || []).map((item: any) => {
      const productImages =
        Array.isArray(item.images) && item.images.length > 0
          ? item.images.slice(0, 10)
          : item.image
            ? [item.image]
            : [];

      return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        oldPrice: item.old_price ? Number(item.old_price) : undefined,
        category: item.category || "Producto",
        image: productImages[0] || "",
        images: productImages,
        description: item.description || "Producto premium disponible en NOXWEAR.",
      };
    });

    console.log("FORMATTED:", formattedProducts);

    setProducts(formattedProducts);
    setLoading(false);
  };

  loadProducts();
}, []);

  const categories = ["Nuestra Colección"];

  const filteredProducts = useMemo(() => {
  return (products || []).filter((product) => {
    const productName = (product.name || "").toLowerCase();
    const productCategory = (product.category || "").toLowerCase();
    const searchValue = search.toLowerCase();

    const matchesSearch =
      productName.includes(searchValue) ||
      productCategory.includes(searchValue);

    const matchesCategory =
      category === "Todo" ? true : (product.category || "") === category;

    return matchesSearch && matchesCategory;
  });
}, [products, search, category]);

const openProductModal = (product: Product) => {
  setSelectedProduct(product);
  setSelectedSize("M");
  setSelectedImage(product.images?.[0] || product.image);
};

const addToCart = (product: Product, size: string) => {
  setCart((prev) => {
    const found = prev.find(
      (item) => item.id === product.id && item.size === size
    );

    if (found) {
      return prev.map((item) =>
        item.id === product.id && item.size === size
          ? { ...item, qty: item.qty + 1 }
          : item
      );
    }

    return [...prev, { ...product, size, qty: 1 }];
  });
    setIsCartOpen(true);
};

  const increaseQty = (id: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePagar = async () => {
    if (!cart || cart.length === 0) {
      alert("Tu carrito esta vacio");
      return;
    }

    try {
      const res = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      });

      const data = await res.json();

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert("Error al iniciar el pago");
        console.log(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error en el pago");
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("noxwear-cart");
  };

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = cart.length > 0 ? 3.99 : 0;
  const total = subtotal + shipping;
  //Mensaje de WhatsApp con el detalle del pedido o mensaje de informacion si el carrito esta vacio
  const whatsappMessage = encodeURIComponent(
    cart.length === 0
      ? "Hola, quiero informacion sobre NOXWEAR."
      : `Hola, quiero hacer este pedido:
${cart
        .map((item) => `- ${item.name} x${item.qty} = $${(item.price * item.qty).toFixed(2)}`)
        .join("\n")}

Subtotal: L.${subtotal.toFixed(2)}
Envio: L.${shipping.toFixed(2)}
Total: L.${total.toFixed(2)}`
  );

  const whatsappLink = `https://wa.me/50495635296?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-[0.25em]">NOXWEAR</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Streetwear premium
            </p>
          </div>

          <nav className="hidden gap-6 text-sm text-white/70 md:flex lg:gap-8">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href="#catalogo" className="hover:text-white">Catalogo</a>
            <button onClick={() => setIsCartOpen(true)} className="hover:text-white">
              Carrito
            </button>
            <a href="#contacto" className="hover:text-white">Contacto</a>
          </nav>
//btn carrito para mobile con emoji 
          <button
            onClick={() => setIsCartOpen(true)}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:scale-105">
            🛒 {totalItems}
          </button>
        </div>
      </header>

      <section
        id="inicio"
        className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:grid-cols-2 md:py-24"
      >
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/70">
            Nuevo drop disponible
          </div>

          <h2 className="max-w-xl text-3xl sm:text-5xl lg:text-7xl font-black leading-tight">
            Viste como si ya fueras la marca.
          </h2>

          <p className="mt-6 max-w-xl text-sm sm:text-base lg:text-lg leading-7 sm:leading-8 text-white/65">
            Streetwear oscuro, elegante y premium. Piezas con estilo fuerte,
            cortes modernos y una vibra que se ve cara desde lejos.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#catalogo"
              className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-neutral-200"
            >
              Comprar ahora
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="rounded-full border border-white/20 px-8 py-3 font-semibold text-white transition hover:bg-white/10">
              Ver carrito
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/55">
            <span>✔ Pago seguro</span>
            <span>✔ Envio rapido</span>
            <span>✔ Cambios faciles</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80"
            alt="Streetwear premium"
            className="h-[300px] sm:h-[420px] lg:h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:px-8 pb-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold">Diseno premium</h3>
          <p className="mt-2 text-white/60">
            Tienda con imagen elegante y vibra de marca real.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold">Drops limitados</h3>
          <p className="mt-2 text-white/60">
            Menos saturacion, mas exclusividad y mas ganas de comprar.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold">Compra rapida</h3>
          <p className="mt-2 text-white/60">
            Catalogo claro, carrito funcional y pedido por WhatsApp.
          </p>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/40">
              Catalogo
            </p>
            <h2 className="mt-2 text-4xl font-black">Nuevo drop 🔥</h2>
          </div>

          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
           className="w-full md:w-80 rounded-full border border-white/10 bg-zinc-900 px-5 py-3 text-sm sm:text-base text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${category === cat
                  ? "bg-white text-black"
                  : "border border-white/10 bg-zinc-900 text-white hover:bg-white/10"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-10 text-center text-white/50">
            Cargando productos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-10 text-center text-white/50">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className="cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition hover:-translate-y-1"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-64 sm:h-80 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                    {product.category || "Dropshipping"}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">{product.name}</h3>

                  <p className="mt-2 text-white/60">
                    {product.description || "Producto premium disponible en NOXWEAR."}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-2xl font-black">${product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-white/30 line-through">
                        ${product.oldPrice}
                      </span>
                    )}
                  </div>

                  /*{/* btn agregar al carrito no ocupar 
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, "M");
                    }}
                    className="mt-5 w-full rounded-full bg-white py-3 font-bold text-black transition hover:bg-neutral-200"
                  >
                    Agregar al carrito
                  </button>*/}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

              {selectedProduct && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80"
            onClick={() => setSelectedProduct(null)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cerrar
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900">
                    <img
                      src={selectedImage || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-[320px] sm:h-[420px] lg:h-[520px] w-full object-cover"
                    />
                  </div>

                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {selectedProduct.images.slice(0, 10).map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img)}
                          className={`overflow-hidden rounded-2xl border ${
                            selectedImage === img
                              ? "border-white"
                              : "border-white/10"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="h-20 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                    {selectedProduct.category || "Dropshipping"}
                  </p>

                  <h2 className="mt-2 text-3xl sm:text-4xl font-black">
                    {selectedProduct.name}
                  </h2>

                  <p className="mt-4 text-white/65 leading-7">
                    {selectedProduct.description || "Producto premium disponible en NOXWEAR."}
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <span className="text-3xl font-black">
                      L.{selectedProduct.price.toFixed(2)}
                    </span>
                    {selectedProduct.oldPrice && (
                      <span className="text-base text-white/30 line-through">
                        L.{selectedProduct.oldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="mt-8">
                    <p className="mb-3 text-sm font-semibold text-white/70">
                      Elige tu talla
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {["S", "M", "L", "XL"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                            selectedSize === size
                              ? "bg-white text-black"
                              : "border border-white/15 bg-zinc-900 text-white hover:bg-white/10"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct, selectedSize);
                      setSelectedProduct(null);
                    }}
                    className="mt-8 w-full rounded-full bg-white py-4 text-sm font-bold text-black transition hover:bg-neutral-200"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setIsCartOpen(false)}
          />

          <aside className="fixed right-0 top-0 z-50 flex h-full w-full sm:max-w-md flex-col border-l border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Tu carrito 🛒</h2>
                <p className="text-sm text-white/50">{totalItems} productos</p>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cart.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/15 bg-zinc-900 p-8 text-center text-white/50">
                  Tu carrito esta vacio.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-white/10 bg-zinc-900 p-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-24 w-24 rounded-2xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-base font-bold">{item.name}</p>
                          <p className="mt-1 text-sm text-white/50">
                            {item.category || "Dropshipping"}
                          </p>
                          <p className="mt-2 text-sm text-white/40">
                            Precio: ${item.price.toFixed(2)}
                          </p>
                          <p className="text-base font-semibold">
                            Subtotal: ${(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => decreaseQty(item.id)}
                            className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
                          >
                            -
                          </button>

                          <span className="w-6 text-center font-bold">{item.qty}</span>

                          <button
                            onClick={() => increaseQty(item.id)}
                            className="rounded-full border border-white/15 px-4 py-2 hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-zinc-950 px-4 py-4 text-sm">
              <div className="space-y-1 text-white/60">
                <div className="flex justify-between">
                  <span>Productos</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>L.{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Envio</span>
                  <span>L.{shipping.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>L.{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await fetch("/api/whatsapp", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        cart: cart,
                        total: total,
                        customer: "Cliente web",
                      }),
                    });

                  } catch (error) {
                    console.error("Error enviando pedido a WhatsApp:", error);
                    alert("No se pudo enviar el pedido a WhatsApp");
                  }
                }}
                className="mt-4 block w-full rounded-full bg-white py-3 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
              >
                Pagar
              </button>

              <button
                onClick={clearCart}
                className="mt-2 w-full rounded-full border border-red-500/40 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Vaciar
              </button>
            </div>
          </aside>
        </>
      )}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Reviews
        </p>
        <h2 className="mt-2 text-4xl font-black">Lo que dice la gente</h2>

        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-6">
            <p className="text-lg font-bold">★★★★★</p>
            <p className="mt-3 text-white/65">
              La ropa se ve cara y el estilo esta brutal. Volveria a comprar.
            </p>
            <p className="mt-4 font-semibold">Kevin M.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-6">
            <p className="text-lg font-bold">★★★★★</p>
            <p className="mt-3 text-white/65">
              La pagina se ve premium y el pedido fue rapido por WhatsApp.
            </p>
            <p className="mt-4 font-semibold">Ashley R.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-6">
            <p className="text-lg font-bold">★★★★★</p>
            <p className="mt-3 text-white/65">
              Buen fit, buen look y no parece tienda generica.
            </p>
            <p className="mt-4 font-semibold">Luis C.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            Proximo drop
          </p>
          <h2 className="mt-2 text-4xl font-black">
            Entra antes que los demas.
          </h2>
          <p className="mt-3 max-w-2xl text-white/60">
            Recibe descuentos tempranos, avisos de lanzamientos y piezas limitadas.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              type="email"
              placeholder="Tu correo"
              className="w-full rounded-full border border-white/10 bg-black px-5 py-4 text-white outline-none placeholder:text-white/30"
            />
            <button className="rounded-full bg-white px-8 py-4 font-bold text-black transition hover:bg-neutral-200">
              Unirme
            </button>
          </div>
        </div>
      </section>

      <footer
        id="contacto"
        className="border-t border-white/10 bg-black/70"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-[0.25em]">NOXWEAR</h3>
            <p className="mt-2 text-white/50">
              Streetwear premium con vibra oscura y elegante.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-white/60">
            <a href="#">Envios</a>
            <a href="#">Cambios</a>
            <a href="#">Privacidad</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 rounded-full bg-green-500 px-6 py-4 font-bold text-black shadow-lg transition hover:scale-105"
      >
        WhatsApp
      </a>
    </div>
  );
}