'use client';

import React, { useState } from 'react';
import { PLANS } from '@/lib/plans';
import { UserPlan } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Check, Zap, Sparkles, ShieldCheck, ArrowRight, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export function BillingView() {
  const { profile, upgradePlanMock } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentPlan = profile?.plan || 'free';

  const handleSelectPlan = async (planId: UserPlan) => {
    if (planId === currentPlan) return;
    setLoadingPlan(planId);
    setSuccessMsg(null);

    try {
      // Simulate/trigger payment provider checkout or instant upgrade for SaaS test
      await new Promise(r => setTimeout(r, 800));
      await upgradePlanMock(planId);
      setSuccessMsg(`Plano alterado para ${PLANS[planId].name} com sucesso! Todos os recursos foram liberados.`);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
          Planos & Assinaturas
        </span>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Escolha o plano ideal para seu negócio
        </h2>
        <p className="text-sm text-slate-400">
          Crie QR Codes estáticos gratuitos ou desbloqueie links dinâmicos rastreáveis, alteração de destino e analytics em tempo real.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl text-center font-medium animate-fadeIn">
          {successMsg}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(PLANS) as UserPlan[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = currentPlan === planKey;
          const isPro = planKey === 'pro';

          return (
            <div
              key={planKey}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative border ${
                isPro
                  ? 'bg-slate-900 border-emerald-500/50 shadow-2xl shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/70 border-slate-800 shadow-xl'
              }`}
            >
              {isPro && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                  Mais Escolhido
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-100">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-slate-700">
                      Plano Atual
                    </span>
                  )}
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{plan.priceFormatted}</span>
                  <span className="text-xs text-slate-400">/ {plan.interval}</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  id={`btn-plan-${planKey}`}
                  onClick={() => handleSelectPlan(planKey)}
                  disabled={isCurrent || loadingPlan === planKey}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : isPro
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 active:scale-[0.98]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-[0.98]'
                  }`}
                >
                  {loadingPlan === planKey ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isCurrent ? (
                    'Plano Ativo'
                  ) : (
                    <>
                      <span>{plan.priceBrl === 0 ? 'Selecionar Grátis' : 'Assinar Agora'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center mt-2.5">
                  Cancele ou altere a qualquer momento sem fidelidade
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Gateways Note */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-slate-200 block">Pagamentos Seguros com Criptografia de Ponta a Ponta</span>
            <span>Integração via Stripe com suporte a Cartão de Crédito, PIX e Boleto.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">PIX Instantâneo</span>
          <span className="text-[11px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">Stripe</span>
        </div>
      </div>
    </div>
  );
}
