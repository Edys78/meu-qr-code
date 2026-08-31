'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeRecord, ScanRecord } from '@/lib/types';
import { getScansForUser, getUserQRCodes } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/use-auth';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  BarChart3, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Globe2, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';

interface AnalyticsDashboardProps {
  initialQrFilter?: QRCodeRecord | null;
}

export function AnalyticsDashboard({ initialQrFilter }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const [qrcodes, setQrcodes] = useState<QRCodeRecord[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedQrId, setSelectedQrId] = useState<string>(initialQrFilter?.id || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [userQrs, userScans] = await Promise.all([
          getUserQRCodes(user.uid),
          getScansForUser(user.uid, 200),
        ]);
        setQrcodes(userQrs);
        setScans(userScans);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Filter scans by selected QR
  const filteredScans = useMemo(() => {
    if (selectedQrId === 'all') return scans;
    return scans.filter(s => s.qrId === selectedQrId);
  }, [scans, selectedQrId]);

  // Calculate Metrics
  const totalScans = useMemo(() => {
    if (selectedQrId === 'all') {
      return qrcodes.reduce((acc, q) => acc + (q.totalScans || 0), 0);
    }
    const current = qrcodes.find(q => q.id === selectedQrId);
    return current?.totalScans || filteredScans.length;
  }, [qrcodes, selectedQrId, filteredScans]);

  // Timeline & scan metrics calculation from scan history
  const { scansToday, scans7Days, timelineData } = useMemo(() => {
    let todayCount = 0;
    let weekCount = 0;

    // Use latest scan or current ISO date
    const latestTimestamp = filteredScans.length > 0 
      ? new Date(filteredScans[0].timestamp).getTime() 
      : 1740800000000; // fallback base

    const todayPrefix = new Date(latestTimestamp).toISOString().slice(0, 10);
    const sevenDaysThreshold = latestTimestamp - 7 * 24 * 60 * 60 * 1000;

    const daysMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(latestTimestamp - i * 24 * 60 * 60 * 1000);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      daysMap[key] = 0;
    }

    filteredScans.forEach(s => {
      if (s.timestamp.startsWith(todayPrefix)) {
        todayCount++;
      }
      const scanTime = new Date(s.timestamp).getTime();
      if (scanTime >= sevenDaysThreshold) {
        weekCount++;
      }
      const d = new Date(s.timestamp);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (daysMap[key] !== undefined) {
        daysMap[key]++;
      }
    });

    const timeline = Object.entries(daysMap).map(([date, count]) => ({ date, scans: count }));

    return {
      scansToday: todayCount,
      scans7Days: weekCount,
      timelineData: timeline,
    };
  }, [filteredScans]);

  // Device Breakdown
  const deviceData = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;

    filteredScans.forEach(s => {
      if (s.deviceType === 'mobile') mobile++;
      else if (s.deviceType === 'tablet') tablet++;
      else desktop++;
    });

    if (mobile === 0 && desktop === 0 && tablet === 0) {
      mobile = 1; // sample baseline
    }

    return [
      { name: 'Celular (Mobile)', value: mobile, color: '#10b981' },
      { name: 'Computador (Desktop)', value: desktop, color: '#38bdf8' },
      { name: 'Tablet', value: tablet, color: '#a855f7' },
    ];
  }, [filteredScans]);

  // OS Breakdown
  const osData = useMemo(() => {
    const osMap: Record<string, number> = {};
    filteredScans.forEach(s => {
      const osName = s.os || 'Outro';
      osMap[osName] = (osMap[osName] || 0) + 1;
    });

    if (Object.keys(osMap).length === 0) {
      return [
        { name: 'Android', count: 0 },
        { name: 'iOS', count: 0 },
        { name: 'Windows', count: 0 },
      ];
    }

    return Object.entries(osMap).map(([name, count]) => ({ name, count }));
  }, [filteredScans]);

  return (
    <div className="space-y-8">
      {/* Header and Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Painel de Analytics & Métricas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rastreamento de acessos em tempo real em conformidade com LGPD
          </p>
        </div>

        {/* QR Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Filtrar por:</label>
          <select
            value={selectedQrId}
            onChange={(e) => setSelectedQrId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 w-full sm:w-56"
          >
            <option value="all">Todos os QR Codes ({qrcodes.length})</option>
            {qrcodes.map(q => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.isDynamic ? 'Dinâmico' : 'Estático'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total de Scans</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{totalScans.toLocaleString('pt-BR')}</span>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950 border border-emerald-800/60 px-2 py-0.5 rounded-md">
              Geral
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Scans Hoje</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{scansToday}</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Hoje
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Últimos 7 Dias</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{scans7Days}</span>
            <span className="text-[11px] text-sky-400 font-medium">Semanal</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Privacidade & LGPD</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 100% Anônimo
            </span>
            <span className="text-[10px] text-slate-500">Sem IP Bruto</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Evolução Temporal de Acessos</h3>
              <p className="text-xs text-slate-400">Scans diários registrados nos últimos 7 dias</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#334155' }} 
                  allowDecimals={false} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  name="Scans"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scansGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown Donut Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Dispositivos Utilizados</h3>
            <p className="text-xs text-slate-400 mb-4">Distribuição entre smartphones e computadores</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {deviceData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300">{d.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scans Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Últimos Acessos Registrados</h3>
            <p className="text-xs text-slate-400">Detalhamento dos acessos em tempo real</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Métricas aproximadas por privacidade de rede</span>
          </div>
        </div>

        {filteredScans.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            Nenhum scan registrado ainda para este filtro. Escaneie o QR Code com a câmera do seu celular para ver os registros aparecerem aqui!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-2.5 px-4 font-semibold">Data / Hora</th>
                  <th className="py-2.5 px-4 font-semibold">Localização</th>
                  <th className="py-2.5 px-4 font-semibold">Dispositivo & SO</th>
                  <th className="py-2.5 px-4 font-semibold">Navegador</th>
                  <th className="py-2.5 px-4 font-semibold">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScans.slice(0, 10).map((s) => {
                  const dateFormatted = new Date(s.timestamp).toLocaleString('pt-BR');
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">{dateFormatted}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {s.city ? `${s.city}, ${s.country || 'Brasil'}` : 'Brasil'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="capitalize">{s.deviceType || 'Mobile'}</span> • {s.os || 'Android'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{s.browser || 'Chrome'}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{s.referer || 'Direto'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
