import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finance OS — Personal Finance Command Center',
  description: 'Your personal financial operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#0F172A] text-[#F8FAFC] antialiased">{children}</body>
    </html>
  )
}

