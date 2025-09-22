import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Deneme Analiz Sonuçları',
  description: 'Optik form analiz ve sınav sonuçları yönetim sistemi',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Console filter for network errors and warnings
            if (typeof window !== 'undefined') {
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.error = function(...args) {
                const message = args.join(' ');
                // Filter out network connection errors
                if (message.includes('ERR_CONNECTION_REFUSED') || 
                    message.includes('Failed to fetch') ||
                    message.includes('Failed to load resource') ||
                    message.includes('the server responded with a status of 404')) {
                  return; // Silent ignore
                }
                originalError.apply(console, args);
              };
              
              console.warn = function(...args) {
                const message = args.join(' ');
                // Filter out accessibility warnings from dev mode
                if (message.includes('Missing Description') || 
                    message.includes('aria-describedby')) {
                  return; // Silent ignore
                }
                originalWarn.apply(console, args);
              };
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
