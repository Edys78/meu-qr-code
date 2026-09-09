'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  Percent, 
  ShieldCheck, 
  Truck
} from 'lucide-react';

interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  priceTag?: string;
  highlight: string;
  url: string;
  ctaText: string;
  tagline: string;
  category: string;
}

const PROMO_ITEMS: PromoItem[] = [
  {
    id: 'promo-1',
    title: 'Oferta Especial em Destaque',
    subtitle: 'Confira as melhores condições, produtos selecionados e frete rápido no Mercado Livre.',
    badge: 'Super Oferta',
    priceTag: 'Melhor Preço',
    highlight: 'Envio Rápido Full',
    url: 'https://meli.la/22jmktU',
    ctaText: 'Ver no Mercado Livre',
    tagline: 'Garantia de Entrega e Compra Protegida',
    category: 'Mercado Livre',
  },
  {
    id: 'promo-2',
    title: 'Desconto Exclusivo e Pronta Entrega',
    subtitle: 'Aproveite preços promocionais com parcelamento facilitado e segurança total na compra.',
    badge: 'Destaque do Dia',
    priceTag: 'Frete Grátis*',
    highlight: 'Compra Garantida',
    url: 'https://meli.la/2VaGEjo',
    ctaText: 'Aproveitar Oferta',
    tagline: 'Oferta por tempo limitado no Mercado Livre',
    category: 'Oportunidade',
  },
  {
    id: 'promo-3',
    title: 'Seleção Premium com Descontos',
    subtitle: 'Tecnologia, utilidades e novidades com os melhores vendedores e avaliações 5 estrelas.',
    badge: 'Recomendado',
    priceTag: 'Top Vendas',
    highlight: 'Até 12x Sem Juros',
    url: 'https://meli.la/1qQrej2',
    ctaText: 'Comprar Agora',
    tagline: 'Estoque limitado • Parcele sua compra',
    category: 'Tendência',
  },
];

export function PromoCarouselBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = React.useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % PROMO_ITEMS.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const handlePrev = React.useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + PROMO_ITEMS.length) % PROMO_ITEMS.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  // Slow automated carousel loop (every 5.5 seconds)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, handleNext]);

  const currentItem = PROMO_ITEMS[currentIndex];

  return (
    <div 
      id="adsense-promo-carousel-banner"
      className="w-full relative my-6 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Banner Container styled like a modern AdSense display unit */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 shadow-lg shadow-amber-500/5 transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-500/10">
        
        {/* Subtle background glow effect */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top AdSense Label Header */}
        <div className="flex items-center justify-between px-3.5 py-1 bg-slate-950/60 border-b border-slate-800/80 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="uppercase tracking-wider font-semibold text-amber-400">Anúncio Patrocinado</span>
            <span className="text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">Ofertas Recomendadas Mercado Livre</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden xs:inline">
              Anúncio {currentIndex + 1} de {PROMO_ITEMS.length}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
              Ad
            </span>
          </div>
        </div>

        {/* Main Banner Body */}
        <div className="p-3.5 sm:p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Shopping Cart Icon Box */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/40 text-amber-400 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 fill-amber-400/20 animate-bounce [animation-duration:3s]" />
              
              {/* Little discount tag indicator */}
              <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            {/* Mobile Title View */}
            <div className="block md:hidden flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300">
                  {currentItem.badge}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  {currentItem.highlight}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 truncate">
                {currentItem.title}
              </h4>
            </div>
          </div>

          {/* Middle: Carousel Ad Content (Dynamic with smooth transition) */}
          <div className="flex-1 w-full text-left overflow-hidden min-w-0">
            <div 
              key={currentItem.id}
              className={`transition-all duration-500 ease-out ${
                isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              <div className="hidden md:flex items-center gap-2.5 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300 inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {currentItem.badge}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Truck className="w-3 h-3" />
                  {currentItem.highlight}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {currentItem.tagline}
                </span>
              </div>

              <a 
                href={currentItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link block"
              >
                <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover/link:text-amber-300 transition-colors flex items-center gap-1.5 leading-snug">
                  <span>{currentItem.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all text-amber-400 shrink-0" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                  {currentItem.subtitle}
                </p>
              </a>
            </div>
          </div>

          {/* Right: CTA Button & Navigation Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            {/* Carousel navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                id="btn-promo-prev"
                onClick={handlePrev}
                aria-label="Anúncio anterior"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1 px-1.5">
                {PROMO_ITEMS.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsAnimating(true);
                      setCurrentIndex(idx);
                      setTimeout(() => setIsAnimating(false), 500);
                    }}
                    aria-label={`Ir para anúncio ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'w-5 bg-amber-400' 
                        : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                id="btn-promo-next"
                onClick={handleNext}
                aria-label="Próximo anúncio"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Link Action CTA Button */}
            <a
              id={`btn-promo-cta-${currentIndex}`}
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition-all duration-200 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{currentItem.ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>

        </div>

        {/* Bottom subtle progress bar indicating slow carousel cycle */}
        <div className="h-0.5 w-full bg-slate-800/60 overflow-hidden">
          <div 
            key={`${currentIndex}-${isPaused ? 'paused' : 'running'}`}
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 origin-left"
            style={{
              animation: isPaused ? 'none' : 'promoProgress 5.5s linear infinite',
              width: isPaused ? '100%' : undefined,
              opacity: isPaused ? 0.4 : 1,
            }}
          />
        </div>

      </div>

      <style jsx global>{`
        @keyframes promoProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
