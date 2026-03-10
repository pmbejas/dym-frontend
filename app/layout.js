import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { CotizacionProvider } from '@/context/CotizacionContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata = {
  title: "DyM Importados",
  description: "Sistema de gestión",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased bg-slate-50 text-slate-900 font-sans`}>
        <ToastProvider>
          <AuthProvider>
            <CotizacionProvider>
               {children}
            </CotizacionProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
