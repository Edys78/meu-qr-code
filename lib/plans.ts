import { PlanConfig, UserPlan } from './types';

export const PLANS: Record<UserPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    priceBrl: 0,
    priceFormatted: 'R$ 0',
    interval: 'para sempre',
    dynamicQRLimit: 1,
    scansLimit: 100,
    hasWatermark: true,
    editableLinks: false,
    svgExport: true,
    pdfExport: false,
    advancedAnalytics: false,
    customDomain: false,
    aiGenerations: 0,
    features: [
      'QR Codes estáticos ilimitados',
      '1 QR Code dinâmico com link curto',
      'Até 100 scans inclusos',
      'Suporte a PIX, URL, Wi-Fi, WhatsApp e vCard',
      'Personalização de cores e pontos',
      'Exportação em PNG e SVG',
      'Leitor QR por câmera e arquivo',
      'Marca d\'água discreta'
    ],
  },
  pro: {
    id: 'pro',
    name: 'Profissional',
    priceBrl: 39,
    priceFormatted: 'R$ 39',
    interval: 'mês',
    dynamicQRLimit: 10,
    scansLimit: 25000,
    hasWatermark: false,
    editableLinks: true,
    svgExport: true,
    pdfExport: true,
    advancedAnalytics: true,
    customDomain: false,
    aiGenerations: 20,
    features: [
      'Tudo do plano Gratuito',
      '10 QR Codes dinâmicos rastreáveis',
      'Alteração do destino sem reimprimir',
      'Até 25.000 scans/mês',
      'Sem nenhuma marca d\'água',
      'Inserção de logotipo próprio',
      'Molduras e chamadas para ação exclusivas',
      'Analytics em tempo real (dispositivo, SO, navegador)',
      'Exportação em Alta Resolução (PNG 4K, SVG)',
      'Suporte prioritário'
    ],
  },
  business: {
    id: 'business',
    name: 'Business / Agência',
    priceBrl: 119,
    priceFormatted: 'R$ 119',
    interval: 'mês',
    dynamicQRLimit: 100,
    scansLimit: 'unlimited',
    hasWatermark: false,
    editableLinks: true,
    svgExport: true,
    pdfExport: true,
    advancedAnalytics: true,
    customDomain: true,
    aiGenerations: 100,
    features: [
      'Tudo do plano Profissional',
      '100 QR Codes dinâmicos',
      'Scans ilimitados',
      'Domínio personalizado (qr.suaempresa.com.br)',
      'Analytics avançados e exportação de relatórios CSV',
      'Recursos de IA para geração de designs',
      'Gestão multi-marcas / projetos',
      'API de integração para desenvolvedores',
      'SLA de 99.9% e atendimento VIP via WhatsApp'
    ],
  },
};

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  provider: 'stripe' | 'mercadopago' | 'asaas' | 'sandbox';
}

export interface PaymentProvider {
  createCheckout(planId: UserPlan, userId: string, userEmail: string): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}
