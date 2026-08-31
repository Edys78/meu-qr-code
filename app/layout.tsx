import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'Meu QR-code — Gerador de QR Codes Estáticos, Dinâmicos & PIX',
  description: 'Plataforma SaaS completa para criação, personalização avançada com logotipo e molduras, rastreamento de links dinâmicos e geração de PIX com chave e valor.',
  openGraph: {
    title: 'Meu QR-code — Gerador de QR Codes Estáticos, Dinâmicos & PIX',
    description: 'Crie QR Codes estáticos e dinâmicos com rastreamento de acessos e personalização avançada.',
    type: 'website',
  },
  other: {
    'google-adsense-account': 'ca-pub-8480512856430313',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
