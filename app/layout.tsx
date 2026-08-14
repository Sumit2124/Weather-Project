import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "mausam-ka-mood.example";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const image = `${protocol}://${host}/og.png`;

      return {
        metadataBase: new URL(`${protocol}://${host}`),
        title: "Mausam ka Mood — Weather, but useful",
    description: "A travel-first, mood-aware weather planner with actual forecast data and a little Hindi sarcasm.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Mausam ka Mood",
      description: "Plan the day. Outsmart the sky.",
      images: [{ url: image, width: 1730, height: 909, alt: "Mausam ka Mood weather planner" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mausam ka Mood",
      description: "Plan the day. Outsmart the sky.",
      images: [image],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
