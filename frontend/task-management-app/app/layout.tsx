import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DoneIt - Task Management",
  description: "Modern Task Management App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} text-slate-800`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock_client_id"}>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
