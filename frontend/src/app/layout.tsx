import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jedermannzehnkampf',
  description: 'Datenerfassungs und Ukrundensystem für den Favoritner Jedermannzehnkampf',
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["Jedermannzehnkampf"],
  authors: [
    { name: "Fabian Traxler" },
  ],
  icons: [
    { rel: "apple-touch-icon", url: "/logo_stw.svg" },
    { rel: "icon", url: "/logo_stw.svg" },
  ]
}

export const viewport: Viewport = {
  themeColor: [{ color: "#ECFEFF" }],
  minimumScale: 1,
  initialScale: 1,
  width: "device-with",
  viewportFit: "cover",
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="h-full overflow-hidden relative light bg-cyan-50 overscroll-none">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={"h-full overflow-hidden relative overscroll-none " + inter.className}>{children}</body>
    </html>
  )
}
