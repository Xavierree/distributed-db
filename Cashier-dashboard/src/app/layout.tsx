import type { Metadata } from "next";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
    title: "Alfamart POS - Point of Sale",
    description: "Point of Sale System for Alfamart Retail Stores",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className="min-h-screen bg-background font-sans antialiased">
                {children}
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                        duration: 3000,
                    }}
                />
            </body>
        </html>
    );
}
