'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { QRCreatorWizard } from '@/components/qr-creator-wizard';
import { QRListTable } from '@/components/qr-list-table';
import { QRScannerView } from '@/components/qr-scanner-view';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { BillingView } from '@/components/billing-view';
import { QRCodeRecord } from '@/lib/types';
import { 
  Zap, 
  QrCode, 
  Layers, 
  Camera, 
  BarChart3, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<string>('generator');
  const [analyticsTargetQR, setAnalyticsTargetQR] = useState<QRCodeRecord | null>(null);

  const handleQRCreated = (qr: QRCodeRecord) => {
    setCurrentTab('qrcodes');
  };

  const handleViewAnalytics = (qr: QRCodeRecord) => {
    setAnalyticsTargetQR(qr);
    setCurrentTab('analytics');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Sticky Header */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tab 1: QR Generator */}
        {currentTab === 'generator' && (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Novo: Suporte nativo a Chave PIX e QR Codes Dinâmicos</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
                Crie QR Codes profissionais com{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  links dinâmicos e PIX
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Personalize com logotipo, cores, gradientes e molduras de ação. Altere o destino mesmo após imprimir e acompanhe acessos em tempo real.
              </p>
            </div>

            {/* Creator Wizard */}
            <QRCreatorWizard onCreated={handleQRCreated} />
          </div>
        )}

        {/* Tab 2: My QR Codes Management */}
        {currentTab === 'qrcodes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Gerenciamento de QR Codes</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Altere destinos de links dinâmicos, acompanhe o total de scans e exporte em alta resolução.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('generator')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <QrCode className="w-4 h-4" />
                <span>Criar Novo QR Code</span>
              </button>
            </div>

            <QRListTable 
              onCreateNew={() => setCurrentTab('generator')} 
              onViewAnalytics={handleViewAnalytics} 
            />
          </div>
        )}

        {/* Tab 3: Camera & File Scanner */}
        {currentTab === 'scanner' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <h1 className="text-2xl font-bold text-slate-100">Leitor e Scanner de QR Code</h1>
              <p className="text-xs text-slate-400">
                Aponte a câmera do seu dispositivo ou faça upload de fotos e imagens para decodificar instantaneamente com privacidade local.
              </p>
            </div>

            <QRScannerView />
          </div>
        )}

        {/* Tab 4: Analytics Dashboard */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard initialQrFilter={analyticsTargetQR} />
          </div>
        )}

        {/* Tab 5: Billing & Pricing */}
        {currentTab === 'billing' && (
          <div className="space-y-6">
            <BillingView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 mt-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              ❖
            </div>
            <span className="font-bold text-slate-200">Meu QR-code</span>
            <span className="text-slate-600">|</span>
            <span>SaaS de QR Codes Estáticos, Dinâmicos & PIX</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <button onClick={() => setCurrentTab('generator')} className="hover:text-slate-200 transition-colors">
              Criar QR
            </button>
            <button onClick={() => setCurrentTab('scanner')} className="hover:text-slate-200 transition-colors">
              Scanner
            </button>
            <button onClick={() => setCurrentTab('billing')} className="hover:text-slate-200 transition-colors">
              Planos
            </button>
            <span className="text-slate-500">Conformidade LGPD & Privacidade</span>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Meu QR-code. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
