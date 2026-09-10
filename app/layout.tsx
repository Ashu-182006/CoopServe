import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const viewport: Viewport = {
  themeColor: "#0e1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CoopServe — Fair Home Services",
  description:
    "CoopServe connects customers with skilled home-service workers through a fair job-rotation algorithm and worker-welfare system.",
  keywords: ["home services", "plumbing", "carpentry", "cleaning", "cooperative", "CoopServe"],
  authors: [{ name: "CoopServe Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    title: "CoopServe",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Hind:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
