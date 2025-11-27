import type { Metadata } from "next";
import { Inter, Montserrat } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ZACORPS | Private Payroll Streaming",
  description: "Encrypted payroll management powered by Fully Homomorphic Encryption. Secure, private, and transparent compensation streaming on blockchain.",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* Polyfill 'global' for libraries that expect Node.js environment */}
        {/* Ensure fetch is accessible (should be native in modern browsers) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof global === 'undefined') {
              window.global = window;
            }
            if (typeof fetch === 'undefined') {
              console.error('fetch API not available - please update your browser');
            }
          `
        }} />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <div className="pt-24">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
