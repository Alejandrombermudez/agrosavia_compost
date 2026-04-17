import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitoreo Pilas de Compost — Agrosavia",
  description: "Dashboard de estadísticas para el seguimiento de pilas de compost",
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
