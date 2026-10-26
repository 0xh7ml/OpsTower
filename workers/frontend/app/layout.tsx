import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpsTower',
  description: 'OpsTower',
  generator: 'OpsTower',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
