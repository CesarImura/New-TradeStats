import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { fontVariables } from "@/lib/fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Traderhub · Coach platform · Prototype",
  description: "Clickable prototype of the white-label coach platform.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Admin sidebar size, before first paint, so a collapsed sidebar does not load wide and then jump (admin-shell.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("admin:sidebar")==="collapsed")document.documentElement.setAttribute("data-admin-sb","collapsed")}catch(e){}` }} />
      </head>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
