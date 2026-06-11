import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaos Bird — LitmusChaos @ KubeCon",
  description:
    "Flap the LitmusChaos Chaos Bird through the cluster, top the leaderboard, and win swag at the LitmusChaos booth.",
  icons: { icon: "/litmus-bird.png" },
};

export const viewport: Viewport = {
  themeColor: "#5b42bc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
