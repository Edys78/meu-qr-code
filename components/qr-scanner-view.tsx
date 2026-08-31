'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Copy, Check, ExternalLink, RefreshCw, AlertCircle, ShieldCheck, Zap, StopCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScannerView() {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    setScanResult(null);
    setIsScanning(true);

    try {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrRef.current.start(
        { facingMode },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onSuccessScan(decodedText);
        },
        () => {
          // Ignore frame-by-frame non-matches
        }
      );
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsScanning(false);
      setErrorMsg('Não foi possível acessar a câmera. Verifique se concedeu permissão no navegador.');
    }
  };

  const stopCamera = async () => {
    if (html5QrRef.current && html5QrRef.current.isScanning) {
      try {
        await html5QrRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const toggleFacingMode = async () => {
    await stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const onSuccessScan = (text: string) => {
    setScanResult(text);
    stopCamera();
    // Vibrate device if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Decode from image file using jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          onSuccessScan(code.data);
        } else {
          // Try with inverted color attempt
          const codeInv = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (codeInv && codeInv.data) {
            onSuccessScan(codeInv.data);
          } else {
            setErrorMsg('Nenhum QR Code legível foi detectado nesta imagem. Tente uma foto mais nítida ou com melhor iluminação.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrl = scanResult?.startsWith('http://') || scanResult?.startsWith('https://');
  const isPix = scanResult?.startsWith('00020126') || scanResult?.includes('br.gov.bcb.pix');
  const isWifi = scanResult?.startsWith('WIFI:');

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Leitor de QR Code</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Escaneie com a câmera ou envie fotos e capturas de tela
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('camera');
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Câmera</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Imagem</span>
          </button>
        </div>
      </div>

      {/* Camera Scanner Tab */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-slate-800">
            <div id="qr-reader-container" className="w-full h-full" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-200 mb-1">Pronto para escanear</h3>
                <p className="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">
                  Aponte a câmera para qualquer QR Code estático, dinâmico ou chave PIX.
                </p>
                <button
                  id="btn-start-camera-scan"
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Iniciar Câmera</span>
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                  onClick={toggleFacingMode}
                  title="Trocar Câmera"
                  className="p-2 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs flex items-center gap-1 shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-xl text-xs flex items-center gap-1 shadow-md"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Parar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload File Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/50 flex flex-col items-center justify-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Arraste uma imagem ou clique para selecionar
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Suporta PNG, JPG, WEBP e capturas de tela com decodificação local segura
            </p>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scan Result Card */}
      {scanResult && (
        <div className="mt-6 bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              QR Code Detectado
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
              {isPix ? 'Chave PIX (EMV)' : isUrl ? 'Link Web' : isWifi ? 'Rede Wi-Fi' : 'Texto'}
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-200 break-all select-all max-h-32 overflow-y-auto mb-4">
            {scanResult}
          </div>

          <div className="flex flex-wrap gap-2">
            {isUrl && (
              <a
                href={scanResult}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>Acessar Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isPix ? 'Copiar Código PIX' : 'Copiar Conteúdo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
