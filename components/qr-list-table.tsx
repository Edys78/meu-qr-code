'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeRecord } from '@/lib/types';
import { getUserQRCodes, toggleQRCodeActive, updateQRCode, deleteQRCode } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/use-auth';
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  BarChart2, 
  Zap, 
  Globe, 
  MessageCircle, 
  Wifi, 
  Contact, 
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { QRDisplay } from './qr-display';

interface QRListTableProps {
  onCreateNew: () => void;
  onViewAnalytics: (qr: QRCodeRecord) => void;
}

export function QRListTable({ onCreateNew, onViewAnalytics }: QRListTableProps) {
  const { user, profile } = useAuth();
  const [qrcodes, setQrcodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Destination Modal State
  const [editingQR, setEditingQR] = useState<QRCodeRecord | null>(null);
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [updatingDest, setUpdatingDest] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Download Preview Modal State
  const [downloadModalQR, setDownloadModalQR] = useState<QRCodeRecord | null>(null);

  const fetchCodes = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getUserQRCodes(user.uid);
      setQrcodes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      return;
    }
    getUserQRCodes(user.uid)
      .then((list) => {
        if (isMounted) {
          setQrcodes(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggleStatus = async (qr: QRCodeRecord) => {
    try {
      const newStatus = await toggleQRCodeActive(qr.id, qr.isActive);
      setQrcodes(prev => prev.map(item => item.id === qr.id ? { ...item, isActive: newStatus } : item));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (qrId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este QR Code? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteQRCode(qrId);
      setQrcodes(prev => prev.filter(item => item.id !== qrId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDestination = async () => {
    if (!editingQR) return;
    setUpdatingDest(true);
    setUpdateMsg(null);
    try {
      let finalTarget = newTargetUrl.trim();
      if (editingQR.type === 'url' && !finalTarget.startsWith('http://') && !finalTarget.startsWith('https://')) {
        finalTarget = `https://${finalTarget}`;
      }

      await updateQRCode(editingQR.id, {
        targetUrl: finalTarget,
      });

      setQrcodes(prev => prev.map(item => item.id === editingQR.id ? { ...item, targetUrl: finalTarget } : item));
      setUpdateMsg('Destino atualizado com sucesso! O QR impresso já está apontando para o novo link.');
      setTimeout(() => {
        setEditingQR(null);
        setUpdateMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setUpdateMsg('Erro ao atualizar destino: ' + (err.message || 'Tente novamente'));
    } finally {
      setUpdatingDest(false);
    }
  };

  const handleCopyLink = (shortCode: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meuqrcode.com.br';
    navigator.clipboard.writeText(`${origin}/r/${shortCode}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered List
  const filtered = qrcodes.filter(qr => {
    const matchSearch = qr.name.toLowerCase().includes(search.toLowerCase()) || 
      qr.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      qr.targetUrl.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' ? true : 
      filterType === 'dynamic' ? qr.isDynamic :
      filterType === 'static' ? !qr.isDynamic : qr.type === filterType;
    return matchSearch && matchType;
  });

  const totalScansSum = qrcodes.reduce((acc, curr) => acc + (curr.totalScans || 0), 0);
  const activeCount = qrcodes.filter(q => q.isActive).length;
  const dynamicCount = qrcodes.filter(q => q.isDynamic).length;
  const dynamicLimit = profile?.dynamicQRLimit || 1;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pix': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'url': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-400" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-indigo-400" />;
      case 'vcard': return <Contact className="w-4 h-4 text-purple-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">QR Codes Dinâmicos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{dynamicCount} <span className="text-sm font-normal text-slate-400">/ {dynamicLimit}</span></span>
            <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
              {dynamicLimit - dynamicCount > 0 ? `${dynamicLimit - dynamicCount} restantes` : 'Limite atingido'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Scans Totais Acumulados</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{totalScansSum.toLocaleString('pt-BR')}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Tempo Real</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Status Ativos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{activeCount} <span className="text-sm font-normal text-slate-400">de {qrcodes.length}</span></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Plano Atual</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 capitalize">{profile?.plan || 'Gratuito'}</span>
            <button
              onClick={onCreateNew}
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-xl shadow-xs transition-colors"
            >
              + Novo QR
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, link ou código..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'dynamic', label: 'Dinâmicos' },
            { id: 'static', label: 'Estáticos' },
            { id: 'pix', label: 'PIX' },
            { id: 'url', label: 'Links' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                filterType === f.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={fetchCodes}
            title="Atualizar lista"
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Carregando seus QR Codes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Nenhum QR Code encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {qrcodes.length === 0
                ? 'Você ainda não criou nenhum QR Code. Comece gerando um QR Code estático, dinâmico ou chave PIX!'
                : 'Nenhum QR Code corresponde aos filtros de busca atuais.'}
            </p>
            <button
              onClick={onCreateNew}
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro QR Code</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/50">
                  <th className="py-3.5 px-4 font-semibold">Nome & Tipo</th>
                  <th className="py-3.5 px-4 font-semibold">Link Curto / Destino</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Scans</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((qr) => {
                  const isCopied = copiedId === qr.id;
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meuqrcode.com.br';
                  const shortUrl = `${origin}/r/${qr.shortCode}`;

                  return (
                    <tr key={qr.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Name & Type */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setDownloadModalQR(qr)}
                            className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 border border-slate-700 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center overflow-hidden"
                            title="Clique para ver / baixar"
                          >
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                                qr.isDynamic ? shortUrl : qr.rawPayload
                              )}`}
                              alt={qr.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div>
                            <span className="font-bold text-slate-200 block text-xs group-hover:text-emerald-400 transition-colors">
                              {qr.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getTypeIcon(qr.type)}
                              <span className="text-[11px] text-slate-400 capitalize">{qr.type}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-semibold ${
                                qr.isDynamic ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {qr.isDynamic ? 'Dinâmico' : 'Estático'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Short Link / Destination */}
                      <td className="py-4 px-4 max-w-xs">
                        {qr.isDynamic ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                                /r/{qr.shortCode}
                              </span>
                              <button
                                onClick={() => handleCopyLink(qr.shortCode, qr.id)}
                                title="Copiar link curto"
                                className="text-slate-400 hover:text-slate-200 transition-colors"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1" title={qr.targetUrl}>
                              <span>Destino: {qr.targetUrl}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 truncate font-mono" title={qr.rawPayload}>
                            {qr.rawPayload.slice(0, 45)}...
                          </div>
                        )}
                      </td>

                      {/* Scans Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl font-mono font-bold text-slate-200">
                          {qr.totalScans || 0}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(qr)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            qr.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                        >
                          {qr.isActive ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                          <span>{qr.isActive ? 'Ativo' : 'Pausado'}</span>
                        </button>
                      </td>

                      {/* Action Menu */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {qr.isDynamic && (
                            <button
                              onClick={() => {
                                setEditingQR(qr);
                                setNewTargetUrl(qr.targetUrl);
                              }}
                              title="Alterar destino do QR impresso"
                              className="p-2 text-slate-400 hover:text-sky-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onViewAnalytics(qr)}
                            title="Ver Analytics"
                            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDownloadModalQR(qr)}
                            title="Baixar em Alta Resolução (PNG/SVG)"
                            className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(qr.id)}
                            title="Excluir QR Code"
                            className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Destination Modal */}
      {editingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Alterar Link de Destino</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atualiza o destino de <strong>{editingQR.name}</strong> sem precisar reimprimir o QR Code!
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 block mb-1">URL Curta do QR Impresso:</span>
              <span className="font-mono text-emerald-400 font-semibold">{typeof window !== 'undefined' ? window.location.origin : ''}/r/{editingQR.shortCode}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Novo Destino</label>
              <input
                type="text"
                value={newTargetUrl}
                onChange={(e) => setNewTargetUrl(e.target.value)}
                placeholder="https://novolink.com.br/cardapio-atualizado.pdf"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {updateMsg && (
              <div className={`p-3 text-xs rounded-xl ${
                updateMsg.includes('sucesso')
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}>
                {updateMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQR(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDestination}
                disabled={updatingDest}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
              >
                {updatingDest ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                <span>Salvar Novo Destino</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download & Preview Modal */}
      {downloadModalQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-slate-100">{downloadModalQR.name}</h3>
            <p className="text-xs text-slate-400 -mt-2">Exportação em Alta Resolução</p>

            <div className="py-2">
              <QRDisplay
                data={downloadModalQR.isDynamic ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${downloadModalQR.shortCode}` : downloadModalQR.rawPayload}
                design={downloadModalQR.design}
                size={240}
                hasWatermark={profile?.plan === 'free'}
                name={downloadModalQR.name}
              />
            </div>

            <button
              onClick={() => setDownloadModalQR(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
