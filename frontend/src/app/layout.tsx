import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jedermannzehnkampf',
  description: 'Datenerfassungs und Ukrundensystem für den Favoritner Jedermannzehnkampg',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="light bg-cyan-50">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
