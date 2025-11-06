import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth-context'

export const metadata: Metadata = {
  title: 'DataAsk - Conversational Business Intelligence',
  description: 'AI-powered analytics platform with multi-database support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
