'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  X, 
  Eye, 
  Sparkles, 
  FileCheck, 
  Maximize2 
} from 'lucide-react';
import { downloadTextAsPDF, getPDFBlobUrl } from '@/lib/pdf-generator';

interface TextPdfReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  title?: string;
}

export function TextPdfReaderModal({ isOpen, onClose, text, title = 'Mensagem de Texto' }: TextPdfReaderModalProps) {
  const [activeMode, setActiveMode] = useState<'text' | 'pdf'>('text');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Compute PDF blob URL using useMemo
  const pdfBlobUrl = React.useMemo(() => {
    if (!isOpen || !text) return null;
    try {
      return getPDFBlobUrl(text, { title });
    } catch (e) {
      console.error('Error generating PDF preview:', e);
      return null;
    }
  }, [isOpen, text, title]);

  // Clean up object URL when component unmounts or blob changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [pdfBlobUrl]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleDownloadPDF = () => {
    downloadTextAsPDF(text, { title });
  };

  const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charsCount = text.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Leitor de Mensagem & Documento</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Texto & PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {title} • {wordsCount} palavras • {charsCount} caracteres
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'text'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ler em Formato de Texto</span>
            </button>

            <button
              onClick={() => setActiveMode('pdf')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'pdf'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar em PDF</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                onClick={handleToggleSpeech}
                title={isSpeaking ? 'Parar leitura por voz' : 'Ler texto em voz alta'}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSpeaking
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                <span className="hidden sm:inline">{isSpeaking ? 'Parar Voz' : 'Ouvir'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeMode === 'text' ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-200 leading-relaxed text-sm whitespace-pre-wrap font-sans select-text shadow-inner">
                {text || <span className="text-slate-500 italic">Nenhum texto informado...</span>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Palavras: <strong className="text-slate-200">{wordsCount}</strong></span>
                  <span>Caracteres: <strong className="text-slate-200">{charsCount}</strong></span>
                  <span>Linhas: <strong className="text-slate-200">{text.split('\n').length}</strong></span>
                </div>

                <span className="text-emerald-400 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" />
                  Pronto para leitura ou conversão em PDF
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
              {pdfBlobUrl ? (
                <iframe 
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0`} 
                  className="w-full h-full border-none"
                  title="Prévia do PDF"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  Carregando visualizador de PDF...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Meu QR-code • Leitor universal de textos e documentos
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/50"
            >
              <Download className="w-4 h-4" />
              <span>Salvar Arquivo PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
