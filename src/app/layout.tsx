import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import Shell from '@/components/Shell'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Relatório Judô',
  description: 'Monitoramento de atletas de alto rendimento',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {session ? <Shell>{children}</Shell> : <>{children}</>}
        </Providers>
      </body>
    </html>
  )
}
