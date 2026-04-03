import "./globals.css";

export const metadata = {
  title: "NOXWEAR",
  description: "Tienda premium",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}