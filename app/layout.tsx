import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insight Dynamics Shooting - Movie',
  description: 'Upload iPhone or camera video, send it to backend analysis, and review beep/shot timing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
