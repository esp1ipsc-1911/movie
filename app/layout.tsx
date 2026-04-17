import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insight Dynamics Shooting - Movie',
  description: 'Analyze timer beep and shots from recorded shooting videos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
