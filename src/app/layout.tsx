import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pronájem skákacího hradu",
  description: "Rezervujte si skákací hrad pro vaši oslavu nebo akci.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className={`${geist.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
