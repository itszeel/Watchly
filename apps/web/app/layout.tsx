import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import ConvexClientProvider from './ConvexClientProvider'
import AuthProvider from './components/AuthProvider'
import PwaRegister from './components/PwaRegister'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Watchly',
  description: 'Track your YouTube watchlist across devices',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Watchly',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
}

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} select-none`}>
        <AuthProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  )
}
