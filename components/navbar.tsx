'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { 
  QrCode, 
  Camera, 
  BarChart3, 
  CreditCard, 
  User, 
  LogOut, 
  Sparkles, 
  Zap, 
  Layers,
  Menu,
  X
} from 'lucide-react';
import { AuthModal } from './auth-modal';
import { PLANS } from '@/lib/plans';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const { user, profile, signOut, signInAsGuest } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const planName = profile?.plan ? PLANS[profile.plan]?.name : 'Gratuito';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('generator')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  Meu QR-code
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded-sm">
                    SaaS
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Estático, Dinâmico & PIX
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'generator', label: 'Criar QR', icon: QrCode },
              { id: 'qrcodes', label: 'Meus QR Codes', icon: Layers },
              { id: 'scanner', label: 'Scanner por Câmera', icon: Camera },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'billing', label: 'Planos & Preços', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Status / Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1.5">
                    <span>{user.displayName || user.email?.split('@')[0] || 'Usuário'}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-md font-medium">
                      {planName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{user.email || 'Conta Conectada'}</span>
                </div>

                <button
                  id="btn-sign-out"
                  onClick={() => signOut()}
                  title="Sair da conta"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-guest-mode"
                  onClick={() => signInAsGuest()}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition-all"
                >
                  Modo Visitante
                </button>
                <button
                  id="btn-open-auth-modal"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Entrar / Criar Conta</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-2 animate-fadeIn">
            {[
              { id: 'generator', label: 'Criar QR', icon: QrCode },
              { id: 'qrcodes', label: 'Meus QR Codes', icon: Layers },
              { id: 'scanner', label: 'Scanner por Câmera', icon: Camera },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'billing', label: 'Planos & Preços', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">{user.displayName || user.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-medium text-xs rounded-xl text-center"
                >
                  Entrar / Criar Conta
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
