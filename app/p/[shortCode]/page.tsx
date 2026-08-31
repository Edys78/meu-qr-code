'use client';

import { useEffect, useState, use } from 'react';
import { getQRCodeByShortCode } from '@/lib/firestore-service';
import { QRCodeRecord } from '@/lib/types';
import { Copy, Check, QrCode, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function PixPaymentPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = use(params);
  const [qr, setQr] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getQRCodeByShortCode(shortCode);
        setQr(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shortCode]);

  const handleCopy = () => {
    if (!qr?.rawPayload) return;
    navigator.clipboard.writeText(qr.rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando pagamento PIX...</p>
        </div>
      </div>
    );
  }

  if (!qr || qr.type !== 'pix' || !qr.pixData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Pagamento não localizado</h1>
          <p className="text-sm text-slate-400 mb-4">Este link de PIX pode ter sido alterado ou desativado.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Voltar para Meu QR-code
          </Link>
        </div>
      </div>
    );
  }

  const { pixData } = qr;
  const formattedAmount = pixData.amount && parseFloat(pixData.amount) > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(pixData.amount))
    : 'Valor a definir no banco';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ❖
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pagamento Instantâneo</span>
              <h2 className="text-sm font-medium text-slate-200">{qr.name || 'Cobrança PIX'}</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Seguro
          </span>
        </div>

        {/* Amount Box */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-center mb-6">
          <span className="text-xs text-slate-400 block mb-1">Valor do Pagamento</span>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formattedAmount}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex flex-col gap-1 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Beneficiário:</span>
              <span className="font-medium text-slate-300">{pixData.merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cidade:</span>
              <span className="font-medium text-slate-300">{pixData.merchantCity}</span>
            </div>
            {pixData.description && (
              <div className="flex justify-between">
                <span className="text-slate-500">Descrição:</span>
                <span className="font-medium text-slate-300">{pixData.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Copy Button */}
        <div className="space-y-3 mb-6">
          <button
            id="btn-copy-pix-payload"
            onClick={handleCopy}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] ${
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Código PIX Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Código PIX (Copia e Cola)
              </>
            )}
          </button>

          {/* Raw payload snippet */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 break-all max-h-20 overflow-y-auto select-all">
            {qr.rawPayload}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800/60 text-xs text-slate-300 space-y-2">
          <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>💡</span> Como pagar:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>Abra o aplicativo do seu banco (Nubank, Itaú, Inter, etc.)</li>
            <li>Selecione a opção <strong>PIX</strong> e depois <strong>PIX Copia e Cola</strong></li>
            <li>Cole o código copiado acima e confirme o pagamento</li>
          </ol>
        </div>

        {/* Footer Brand */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <span>Gerado por <strong>Meu QR-code</strong></span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
