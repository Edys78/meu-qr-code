'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { QRDesign } from '@/lib/types';
import { Download, Copy, Check, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRDisplayProps {
  data: string;
  design: QRDesign;
  size?: number;
  showDownloadOptions?: boolean;
  hasWatermark?: boolean;
  onDownloaded?: () => void;
  className?: string;
  name?: string;
}

export function QRDisplay({
  data,
  design,
  size = 280,
  showDownloadOptions = true,
  hasWatermark = false,
  onDownloaded,
  className = '',
  name = 'meu-qrcode',
}: QRDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const readabilityIssue = useMemo(() => {
    // Simple luminance calculation
    const getLuminance = (hex: string) => {
      const c = (hex || '').replace('#', '');
      if (c.length !== 6) return 0.5;
      const r = parseInt(c.substr(0, 2), 16) / 255;
      const g = parseInt(c.substr(2, 2), 16) / 255;
      const b = parseInt(c.substr(4, 2), 16) / 255;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const bgLum = getLuminance(design.backgroundColor || '#ffffff');
    const dotLum = getLuminance(design.dotsColor || '#000000');
    const diff = Math.abs(bgLum - dotLum);

    if (diff < 0.25) {
      return 'Contraste baixo entre o fundo e os pontos. Leitores de QR Code podem falhar.';
    } else if (design.logoUrl && design.errorCorrectionLevel === 'L') {
      return 'Logotipo presente com Correção de Erro nível "L". Recomendamos nível "Q" ou "H" para leitura perfeita.';
    }
    return null;
  }, [design]);

  // Initialize or update QRCodeStyling instance
  useEffect(() => {
    if (!data) return;

    const qrOptions: any = {
      width: size,
      height: size,
      type: 'canvas',
      data: data || 'https://meuqrcode.com.br',
      image: design.logoUrl || undefined,
      margin: design.margin ?? 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: design.errorCorrectionLevel || (design.logoUrl ? 'H' : 'M'),
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: design.logoSize || 0.25,
        margin: design.logoMargin || 4,
        crossOrigin: 'anonymous',
      },
      dotsOptions: {
        type: design.dotsType || 'rounded',
        color: design.dotsColor || '#0f172a',
        ...(design.gradientEnabled
          ? {
              gradient: {
                type: design.gradientType || 'linear',
                rotation: design.gradientRotation || 0,
                colorStops: [
                  { offset: 0, color: design.gradientStartColor || '#0284c7' },
                  { offset: 1, color: design.gradientEndColor || '#0f172a' },
                ],
              },
            }
          : {}),
      },
      backgroundOptions: {
        color: design.backgroundColor || '#ffffff',
      },
      cornersSquareOptions: {
        type: design.cornerSquareType || 'extra-rounded',
        color: design.cornerSquareColor || design.dotsColor || '#0f172a',
      },
      cornersDotOptions: {
        type: design.cornerDotType || 'dot',
        color: design.cornerDotColor || design.dotsColor || '#0f172a',
      },
    };

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling(qrOptions);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeRef.current.append(containerRef.current);
      }
    } else {
      qrCodeRef.current.update(qrOptions);
    }
  }, [data, design, size]);

  // High resolution PNG download with frame support
  const handleDownloadPNG = async (exportSize = 2000) => {
    setDownloading(true);
    try {
      const exportQr = new QRCodeStyling({
        width: exportSize,
        height: exportSize,
        type: 'canvas',
        data: data || 'https://meuqrcode.com.br',
        image: design.logoUrl || undefined,
        margin: (design.margin ?? 10) * (exportSize / 280),
        qrOptions: {
          errorCorrectionLevel: design.errorCorrectionLevel || (design.logoUrl ? 'H' : 'M'),
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: design.logoSize || 0.25,
          margin: (design.logoMargin || 4) * (exportSize / 280),
          crossOrigin: 'anonymous',
        },
        dotsOptions: {
          type: design.dotsType || 'rounded',
          color: design.dotsColor || '#0f172a',
          ...(design.gradientEnabled
            ? {
                gradient: {
                  type: design.gradientType || 'linear',
                  rotation: design.gradientRotation || 0,
                  colorStops: [
                    { offset: 0, color: design.gradientStartColor || '#0284c7' },
                    { offset: 1, color: design.gradientEndColor || '#0f172a' },
                  ],
                },
              }
            : {}),
        },
        backgroundOptions: {
          color: design.backgroundColor || '#ffffff',
        },
        cornersSquareOptions: {
          type: design.cornerSquareType || 'extra-rounded',
          color: design.cornerSquareColor || design.dotsColor || '#0f172a',
        },
        cornersDotOptions: {
          type: design.cornerDotType || 'dot',
          color: design.cornerDotColor || design.dotsColor || '#0f172a',
        },
      });

      const blob = await exportQr.getRawData('png');
      if (!blob) throw new Error('Não foi possível gerar PNG');

      // If there's a frame or watermark, compose onto an enlarged canvas
      const frame = design.frame;
      if (frame || hasWatermark) {
        const img = new Image();
        const url = URL.createObjectURL(blob as Blob);
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const extraTop = frame?.position === 'top' ? exportSize * 0.22 : 0;
        const extraBottom = (frame?.position === 'bottom' ? exportSize * 0.22 : 0) + (hasWatermark ? exportSize * 0.08 : 0);
        const padding = exportSize * 0.08;

        canvas.width = exportSize + padding * 2;
        canvas.height = exportSize + padding * 2 + extraTop + extraBottom;

        // Draw background
        ctx.fillStyle = frame?.bgColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR
        ctx.drawImage(img, padding, padding + extraTop, exportSize, exportSize);

        // Draw Frame Banner
        if (frame) {
          ctx.fillStyle = frame.textColor || '#ffffff';
          ctx.font = `bold ${Math.round(exportSize * 0.055)}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textY = frame.position === 'top' 
            ? padding + extraTop / 2 
            : canvas.height - padding - (hasWatermark ? exportSize * 0.08 : 0) - (extraBottom - (hasWatermark ? exportSize * 0.08 : 0)) / 2;
          
          ctx.fillText(frame.label.toUpperCase(), canvas.width / 2, textY);
        }

        // Draw Watermark if applicable
        if (hasWatermark) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = `${Math.round(exportSize * 0.026)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('Gerado por Meu QR-code (Grátis)', canvas.width / 2, canvas.height - padding * 0.6);
        }

        const finalDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-hd.png`;
        link.href = finalDataUrl;
        link.click();
      } else {
        const link = document.createElement('a');
        link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-hd.png`;
        link.href = URL.createObjectURL(blob as Blob);
        link.click();
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      onDownloaded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  // Pure Vector SVG download
  const handleDownloadSVG = async () => {
    setDownloading(true);
    try {
      const exportQr = new QRCodeStyling({
        width: 1000,
        height: 1000,
        type: 'svg',
        data: data || 'https://meuqrcode.com.br',
        image: design.logoUrl || undefined,
        margin: design.margin ?? 10,
        qrOptions: {
          errorCorrectionLevel: design.errorCorrectionLevel || (design.logoUrl ? 'H' : 'M'),
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: design.logoSize || 0.25,
          margin: design.logoMargin || 4,
          crossOrigin: 'anonymous',
        },
        dotsOptions: {
          type: design.dotsType || 'rounded',
          color: design.dotsColor || '#0f172a',
        },
        backgroundOptions: {
          color: design.backgroundColor || '#ffffff',
        },
        cornersSquareOptions: {
          type: design.cornerSquareType || 'extra-rounded',
          color: design.cornerSquareColor || design.dotsColor || '#0f172a',
        },
        cornersDotOptions: {
          type: design.cornerDotType || 'dot',
          color: design.cornerDotColor || design.dotsColor || '#0f172a',
        },
      });

      await exportQr.download({
        name: `${name.toLowerCase().replace(/\s+/g, '-')}-vector`,
        extension: 'svg',
      });

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      onDownloaded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const frame = design.frame;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Readability warning notification */}
      {readabilityIssue && (
        <div className="w-full mb-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-xl flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{readabilityIssue}</span>
        </div>
      )}

      {/* QR Code Container with Frame */}
      <div 
        id="qr-preview-wrapper"
        className="rounded-3xl p-5 shadow-xl transition-all duration-300 relative flex flex-col items-center justify-center border"
        style={{
          backgroundColor: frame?.bgColor || design.backgroundColor || '#ffffff',
          borderColor: frame ? 'transparent' : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Top Frame CTA */}
        {frame && frame.position === 'top' && (
          <div 
            className="w-full text-center py-2 px-3 mb-3 rounded-xl font-bold tracking-wide text-xs uppercase"
            style={{ color: frame.textColor, backgroundColor: 'rgba(0,0,0,0.1)' }}
          >
            {frame.label}
          </div>
        )}

        {/* QR Code Canvas */}
        <div 
          ref={containerRef} 
          className="overflow-hidden rounded-2xl flex items-center justify-center bg-white p-2 shadow-inner"
          style={{ backgroundColor: design.backgroundColor || '#ffffff' }}
        />

        {/* Bottom Frame CTA */}
        {frame && frame.position === 'bottom' && (
          <div 
            className="w-full text-center py-2 px-3 mt-3 rounded-xl font-bold tracking-wide text-xs uppercase"
            style={{ color: frame.textColor, backgroundColor: 'rgba(0,0,0,0.15)' }}
          >
            {frame.label}
          </div>
        )}

        {/* Discreet watermark for free users */}
        {hasWatermark && (
          <span className="text-[10px] text-slate-400 mt-2 font-medium tracking-tight">
            Meu QR-code Free
          </span>
        )}
      </div>

      {/* Export Controls */}
      {showDownloadOptions && (
        <div className="w-full mt-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-download-png-hd"
              onClick={() => handleDownloadPNG(2000)}
              disabled={downloading}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG (Ultra HD)</span>
            </button>

            <button
              id="btn-download-svg-vector"
              onClick={handleDownloadSVG}
              disabled={downloading}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SVG (Vetor)</span>
            </button>
          </div>

          <button
            id="btn-copy-raw-data"
            onClick={handleCopyPayload}
            className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Conteúdo copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto / URL do QR</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
