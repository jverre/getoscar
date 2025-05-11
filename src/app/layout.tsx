import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider as UISidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppProvider } from "@/context/appContext";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/layout/siteheader";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oscar", // Updated title
  description: "Your personal assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-full bg-background text-foreground`}
        >
          <ConvexClientProvider>
            <AppProvider>
              <UISidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <SiteHeader />
                  <div className="@container/main flex flex-1 flex-col gap-2 overflow-y-auto">
                    {children}
                  </div>
                </SidebarInset>
              </UISidebarProvider>
            </AppProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}