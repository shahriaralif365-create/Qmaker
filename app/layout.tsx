import type { Metadata } from "next";
import { Inter, Noto_Serif_Bengali, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Crimson_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSerifBN = Noto_Serif_Bengali({ 
  weight: ["400", "700"],
  subsets: ["bengali"], 
  variable: "--font-serif-bn" 
});
const notoNaskhAR = Noto_Naskh_Arabic({ 
  weight: ["400", "700"],
  subsets: ["arabic"], 
  variable: "--font-naskh-ar" 
});
const notoNastaliqUR = Noto_Nastaliq_Urdu({ 
  weight: ["400"], 
  subsets: ["arabic"], 
  variable: "--font-nastaliq-ur" 
});
const crimson = Crimson_Pro({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson"
});

export const metadata: Metadata = {
  title: "Easy question maker",
  description: "Advanced AI-powered Question Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSerifBN.variable} ${notoNaskhAR.variable} ${notoNastaliqUR.variable} ${crimson.variable} antialiased font-serif-bn`}>
        {children}
      </body>
    </html>
  );
}
