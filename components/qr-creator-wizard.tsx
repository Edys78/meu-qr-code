'use client';

import React, { useState, useMemo } from 'react';
import { 
  QRType, 
  QRDesign, 
  PixData, 
  WifiData, 
  VCardData, 
  WhatsAppData,
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
  FrameConfig,
  QRCodeRecord
} from '@/lib/types';
import { generatePixPayload } from '@/lib/pix';
import { QRDisplay } from './qr-display';
import { useAuth } from '@/hooks/use-auth';
import { createQRCode, generateShortCode } from '@/lib/firestore-service';
import { 
  Globe, 
  QrCode, 
  MessageCircle, 
  Wifi, 
  Contact, 
  FileText, 
  Palette, 
  Sliders, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Save, 
  ShieldAlert, 
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRCreatorWizardProps {
  onCreated?: (qr: QRCodeRecord) => void;
  initialData?: Partial<QRCodeRecord>;
}

export function QRCreatorWizard({ onCreated, initialData }: QRCreatorWizardProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'frames'>('content');
  const [qrType, setQrType] = useState<QRType>(initialData?.type || 'pix');
  const [isDynamic, setIsDynamic] = useState<boolean>(initialData?.isDynamic ?? false);
  const [qrName, setQrName] = useState(initialData?.name || 'Meu QR Code');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Content States
  const [url, setUrl] = useState(initialData?.targetUrl || 'https://');
  const [text, setText] = useState('');
  
  // PIX State
  const [pix, setPix] = useState<PixData>(initialData?.pixData || {
    keyType: 'cpf',
    key: '',
    merchantName: 'Meu Estabelecimento',
    merchantCity: 'SAO PAULO',
    amount: '',
    txId: '***',
    description: 'Pagamento via PIX',
  });

  // WhatsApp State
  const [whatsapp, setWhatsapp] = useState<WhatsAppData>(initialData?.whatsappData || {
    phone: '5511999998888',
    message: 'Olá! Gostaria de mais informações.',
  });

  // Wi-Fi State
  const [wifi, setWifi] = useState<WifiData>(initialData?.wifiData || {
    ssid: 'MinhaRede_5G',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });

  // vCard State
  const [vcard, setVcard] = useState<VCardData>(initialData?.vcardData || {
    firstName: 'João',
    lastName: 'Silva',
    organization: 'Minha Empresa',
    title: 'Diretor',
    phone: '+55 11 98888-7777',
    email: 'contato@empresa.com.br',
    website: 'https://empresa.com.br',
  });

  // Design State
  const [design, setDesign] = useState<QRDesign>(initialData?.design || {
    dotsColor: '#0f172a',
    backgroundColor: '#ffffff',
    dotsType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    cornerSquareColor: '#0f172a',
    cornerDotColor: '#0f172a',
    gradientEnabled: false,
    gradientType: 'linear',
    gradientStartColor: '#0284c7',
    gradientEndColor: '#0f172a',
    gradientRotation: 45,
    logoUrl: null,
    logoSize: 0.25,
    logoMargin: 4,
    errorCorrectionLevel: 'M',
    margin: 8,
    frame: null,
  });

  // Calculate Raw Payload for Static/Dynamic
  const calculatedRawPayload = useMemo(() => {
    switch (qrType) {
      case 'pix':
        if (!pix.key) return 'https://meuqrcode.com.br';
        return generatePixPayload(pix);
      case 'url':
        return url.trim() || 'https://meuqrcode.com.br';
      case 'whatsapp':
        const cleanPhone = whatsapp.phone.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(whatsapp.message || '');
        return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      case 'wifi':
        return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password || ''};H:${wifi.hidden ? 'true' : 'false'};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName || ''};${vcard.firstName || ''};;;\nFN:${vcard.firstName} ${vcard.lastName || ''}\nORG:${vcard.organization || ''}\nTITLE:${vcard.title || ''}\nTEL;TYPE=CELL:${vcard.phone || ''}\nEMAIL:${vcard.email || ''}\nURL:${vcard.website || ''}\nEND:VCARD`;
      case 'text':
        return text || 'Meu QR-code';
      default:
        return 'https://meuqrcode.com.br';
    }
  }, [qrType, pix, url, whatsapp, wifi, vcard, text]);

  // If dynamic, use shortCode link placeholder for preview
  const shortCodePreview = useMemo(() => initialData?.shortCode || generateShortCode(6), [initialData]);
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://meuqrcode.com.br';
  const dynamicPreviewUrl = `${appOrigin}/r/${shortCodePreview}`;
  const effectiveQRData = isDynamic ? dynamicPreviewUrl : calculatedRawPayload;

  // Handle Save
  const handleSaveQRCode = async () => {
    if (!user) {
      setSaveError('Faça login ou continue como visitante para salvar seus QR Codes.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const newQR = await createQRCode({
        userId: user.uid,
        shortCode: shortCodePreview,
        name: qrName || 'Meu QR Code',
        type: qrType,
        targetUrl: qrType === 'url' ? url : `${appOrigin}/p/${shortCodePreview}`,
        rawPayload: calculatedRawPayload,
        isDynamic,
        isActive: true,
        design,
        pixData: qrType === 'pix' ? pix : undefined,
        wifiData: qrType === 'wifi' ? wifi : undefined,
        vcardData: qrType === 'vcard' ? vcard : undefined,
        whatsappData: qrType === 'whatsapp' ? whatsapp : undefined,
      }, profile?.plan || 'free');

      setSaveSuccess(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onCreated?.(newQR);
    } catch (err: any) {
      console.error('Error saving QR code:', err);
      setSaveError(err.message || 'Erro ao salvar QR Code.');
    } finally {
      setSaving(false);
    }
  };

  // Preset Frame Templates
  const framePresets: FrameConfig[] = [
    {
      id: 'frame-pix',
      label: 'PAGUE COM PIX AQUI',
      textColor: '#ffffff',
      bgColor: '#059669',
      position: 'bottom',
      style: 'banner',
    },
    {
      id: 'frame-scan',
      label: 'APONTE A CÂMERA AQUI',
      textColor: '#ffffff',
      bgColor: '#0284c7',
      position: 'top',
      style: 'banner',
    },
    {
      id: 'frame-menu',
      label: 'ESCANEIE PARA VER O CARDÁPIO',
      textColor: '#ffffff',
      bgColor: '#d97706',
      position: 'bottom',
      style: 'banner',
    },
    {
      id: 'frame-wifi',
      label: 'WI-FI GRÁTIS',
      textColor: '#ffffff',
      bgColor: '#4f46e5',
      position: 'top',
      style: 'banner',
    },
    {
      id: 'frame-instagram',
      label: 'SIGA-NOS NO INSTAGRAM',
      textColor: '#ffffff',
      bgColor: '#e11d48',
      position: 'bottom',
      style: 'banner',
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form & Configuration Studio */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Top Header Tabs */}
        <div className="flex border-b border-slate-800 pb-4 mb-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'content'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. Tipo & Conteúdo</span>
          </button>

          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'design'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>2. Cores & Estilo</span>
          </button>

          <button
            onClick={() => setActiveTab('frames')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'frames'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Molduras & CTA</span>
          </button>
        </div>

        {/* Tab 1: Content Configuration */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* QR Code Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nome do QR Code
              </label>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                placeholder="Ex: Chave PIX Balcão, Cardápio Verão, Wi-Fi Clientes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Type Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Escolha o Tipo de Conteúdo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'pix', label: 'Chave PIX', icon: Zap, color: 'text-emerald-400', badge: 'Popular' },
                  { id: 'url', label: 'Website / URL', icon: Globe, color: 'text-sky-400' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' },
                  { id: 'wifi', label: 'Rede Wi-Fi', icon: Wifi, color: 'text-indigo-400' },
                  { id: 'vcard', label: 'vCard Contato', icon: Contact, color: 'text-purple-400' },
                  { id: 'text', label: 'Texto Livre', icon: FileText, color: 'text-slate-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = qrType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setQrType(item.id as QRType)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      {item.badge && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Static vs Dynamic Switch (Especially for URL and PIX) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Tipo de Redirecionamento</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isDynamic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isDynamic ? 'QR Dinâmico' : 'QR Estático'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {isDynamic 
                      ? 'Link curto rastreável. Permite alterar o destino mesmo após imprimir e registrar analytics!'
                      : 'Codifica a informação diretamente na imagem. Sem servidor de redirecionamento intermediário.'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isDynamic} 
                    onChange={(e) => setIsDynamic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Dynamic Fields Based on QR Type */}
            {qrType === 'pix' && (
              <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Zap className="w-4 h-4" />
                  <span>Configuração da Chave PIX (Padrão Oficial BCB EMVCo)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Tipo de Chave</label>
                    <select
                      value={pix.keyType}
                      onChange={(e) => setPix({ ...pix, keyType: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="phone">Celular (+55)</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Chave PIX</label>
                    <input
                      type="text"
                      value={pix.key}
                      onChange={(e) => setPix({ ...pix, key: e.target.value })}
                      placeholder={
                        pix.keyType === 'cpf' ? '000.000.000-00' :
                        pix.keyType === 'cnpj' ? '00.000.000/0000-00' :
                        pix.keyType === 'phone' ? '11999998888' :
                        pix.keyType === 'email' ? 'financeiro@empresa.com' : 'Chave EVP...'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome do Beneficiário (Max 25)</label>
                    <input
                      type="text"
                      maxLength={25}
                      value={pix.merchantName}
                      onChange={(e) => setPix({ ...pix, merchantName: e.target.value })}
                      placeholder="Ex: João da Silva ME"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Cidade do Beneficiário (Max 15)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={pix.merchantCity}
                      onChange={(e) => setPix({ ...pix, merchantCity: e.target.value })}
                      placeholder="Ex: SAO PAULO"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Valor (R$) - Opcional</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pix.amount}
                      onChange={(e) => setPix({ ...pix, amount: e.target.value })}
                      placeholder="0.00 (ou em branco p/ valor livre)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Identificador TxID (Opcional)</label>
                    <input
                      type="text"
                      maxLength={25}
                      value={pix.txId}
                      onChange={(e) => setPix({ ...pix, txId: e.target.value })}
                      placeholder="*** (ou código do pedido)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {qrType === 'url' && (
              <div className="space-y-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">URL / Link de Destino</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://meusite.com.br/cardapio"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>
            )}

            {qrType === 'whatsapp' && (
              <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Número WhatsApp (com DDD)</label>
                  <input
                    type="text"
                    value={whatsapp.phone}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phone: e.target.value })}
                    placeholder="Ex: 5511999998888"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Mensagem Pré-definida (Opcional)</label>
                  <textarea
                    rows={2}
                    value={whatsapp.message}
                    onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })}
                    placeholder="Olá! Gostaria de fazer um pedido..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome da Rede (SSID)</label>
                    <input
                      type="text"
                      value={wifi.ssid}
                      onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                      placeholder="Ex: Restaurante_Clientes"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Senha do Wi-Fi</label>
                    <input
                      type="password"
                      value={wifi.password}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      placeholder="Senha de acesso..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={vcard.firstName}
                    onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Sobrenome</label>
                  <input
                    type="text"
                    value={vcard.lastName}
                    onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Empresa / Organização</label>
                  <input
                    type="text"
                    value={vcard.organization}
                    onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={vcard.phone}
                    onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {qrType === 'text' && (
              <div className="space-y-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Texto a Codificar</label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite qualquer texto..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-slate-500 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Visual Styling & Colors */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Dot Shapes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Padrão dos Pontos (Dots Pattern)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'square', label: 'Quadrado' },
                  { id: 'dots', label: 'Circular' },
                  { id: 'rounded', label: 'Arredondado' },
                  { id: 'extra-rounded', label: 'Oval' },
                  { id: 'classy', label: 'Elegante' },
                  { id: 'classy-rounded', label: 'Suave' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDesign({ ...design, dotsType: item.id as DotType })}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                      design.dotsType === item.id
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Square & Dot Shapes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Formato do Canto Externo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'square', label: 'Quadrado' },
                    { id: 'dot', label: 'Circular' },
                    { id: 'extra-rounded', label: 'Arredondado' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDesign({ ...design, cornerSquareType: item.id as CornerSquareType })}
                      className={`py-2 px-1.5 rounded-xl border text-center text-xs transition-all ${
                        design.cornerSquareType === item.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Formato do Ponto do Canto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'square', label: 'Quadrado' },
                    { id: 'dot', label: 'Circular' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDesign({ ...design, cornerDotType: item.id as CornerDotType })}
                      className={`py-2 px-1.5 rounded-xl border text-center text-xs transition-all ${
                        design.cornerDotType === item.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Cores Principais</span>
                <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.gradientEnabled}
                    onChange={(e) => setDesign({ ...design, gradientEnabled: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Ativar Gradiente</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cor dos Pontos</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <input
                      type="color"
                      value={design.dotsColor}
                      onChange={(e) => setDesign({ ...design, dotsColor: e.target.value })}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{design.dotsColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fundo</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <input
                      type="color"
                      value={design.backgroundColor}
                      onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{design.backgroundColor}</span>
                  </div>
                </div>

                {design.gradientEnabled ? (
                  <>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Fim do Gradiente</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={design.gradientEndColor}
                          onChange={(e) => setDesign({ ...design, gradientEndColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-slate-300">{design.gradientEndColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Tipo Gradiente</label>
                      <select
                        value={design.gradientType}
                        onChange={(e) => setDesign({ ...design, gradientType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-hidden"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Cor dos Cantos</label>
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={design.cornerSquareColor}
                          onChange={(e) => setDesign({ ...design, cornerSquareColor: e.target.value, cornerDotColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono text-slate-300">{design.cornerSquareColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Correção de Erro</label>
                      <select
                        value={design.errorCorrectionLevel}
                        onChange={(e) => setDesign({ ...design, errorCorrectionLevel: e.target.value as ErrorCorrectionLevel })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-hidden"
                      >
                        <option value="L">L (Baixa - 7%)</option>
                        <option value="M">M (Média - 15%)</option>
                        <option value="Q">Q (Alta - 25%)</option>
                        <option value="H">H (Máxima - 30%)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Central Logo Upload */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logotipo Central</span>
                </span>
                {design.logoUrl && (
                  <button
                    onClick={() => setDesign({ ...design, logoUrl: null })}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Remover logo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all">
                  <span>Selecionar Imagem (PNG/SVG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setDesign({
                          ...design,
                          logoUrl: reader.result as string,
                          errorCorrectionLevel: 'H', // auto upgrade for readability
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {design.logoUrl && (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Tamanho:</span>
                    <input
                      type="range"
                      min="0.15"
                      max="0.38"
                      step="0.02"
                      value={design.logoSize}
                      onChange={(e) => setDesign({ ...design, logoSize: parseFloat(e.target.value) })}
                      className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Frames and CTA Borders */}
        {activeTab === 'frames' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Molduras Rápidas (Call to Action)
                </label>
                {design.frame && (
                  <button
                    onClick={() => setDesign({ ...design, frame: null })}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Sem moldura
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {framePresets.map((f) => {
                  const isSelected = design.frame?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setDesign({ ...design, frame: f })}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{f.label}</span>
                        <span className="text-[10px] text-slate-400">Posição: {f.position === 'top' ? 'Topo' : 'Rodapé'}</span>
                      </div>
                      <div
                        className="w-5 h-5 rounded-md border border-white/20"
                        style={{ backgroundColor: f.bgColor }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Frame Editor */}
            {design.frame && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">Personalizar Texto e Cores da Moldura</span>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto do Banner</label>
                  <input
                    type="text"
                    value={design.frame.label}
                    onChange={(e) => setDesign({ ...design, frame: { ...design.frame!, label: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cor do Fundo</label>
                    <input
                      type="color"
                      value={design.frame.bgColor}
                      onChange={(e) => setDesign({ ...design, frame: { ...design.frame!, bgColor: e.target.value } })}
                      className="w-full h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cor do Texto</label>
                    <input
                      type="color"
                      value={design.frame.textColor}
                      onChange={(e) => setDesign({ ...design, frame: { ...design.frame!, textColor: e.target.value } })}
                      className="w-full h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Posição</label>
                    <select
                      value={design.frame.position}
                      onChange={(e) => setDesign({ ...design, frame: { ...design.frame!, position: e.target.value as any } })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-hidden"
                    >
                      <option value="bottom">Rodapé</option>
                      <option value="top">Topo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save button & notifications */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {isDynamic ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                QR Dinâmico: Redirecionará via <code>/r/{shortCodePreview}</code>
              </span>
            ) : (
              <span>QR Estático: Dados salvos permanentemente na matriz.</span>
            )}
          </div>

          <button
            id="btn-save-qr-code"
            onClick={handleSaveQRCode}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Salvar no Meu Painel</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>QR Code salvo com sucesso! Você pode gerenciá-lo a qualquer momento no seu painel.</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Right Column: Live Interactive Preview & Export Hub */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center sticky top-6">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Pré-visualização em Tempo Real
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {qrType.toUpperCase()}
          </span>
        </div>

        <QRDisplay
          data={effectiveQRData}
          design={design}
          size={250}
          hasWatermark={profile?.plan === 'free'}
          name={qrName}
        />

        {/* Informative Hint */}
        <div className="w-full mt-6 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <Info className="w-3 h-3 text-emerald-400" />
            <span>Dica de Impressão:</span>
          </div>
          <p>
            O formato <strong>SVG</strong> é 100% vetorial e ideal para gráficas, banners e adesivos sem perda de qualidade.
          </p>
        </div>
      </div>
    </div>
  );
}
