import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider as UISidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarProvider as NavSidebarProvider } from "@/context/nav-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/layout/siteheader";
import { UserProvider } from '@/context/user-context'
import { AppProvider } from "@/context/appContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenMCP Chat", // Updated title
  description: "Chat interface for OpenMCP", // Updated description
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-full bg-background text-foreground`} // Added flex, h-full, bg, text
      >
        <AppProvider>
          <UISidebarProvider>
            <UserProvider>
            <AppSidebar />
            <SidebarInset>
              <SiteHeader />
              <div className="@container/main flex flex-1 flex-col gap-2">
                {children}
              </div>
            </SidebarInset>
            </UserProvider>
          </UISidebarProvider>
        </AppProvider>
      </body>
    </html>
  );
}