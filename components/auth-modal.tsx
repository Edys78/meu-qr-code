'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthSuccess = () => {
    router.push('/');
    router.refresh();
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        handleAuthSuccess();
      } else if (mode === 'register') {
        await signUpWithEmail(email, password, name);
        handleAuthSuccess();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('E-mail de recuperação enviado com sucesso. Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está na lista de domínios autorizados do Firebase para login com Google. Utilize o login por E-mail e Senha ou o Modo Visitante abaixo, que funcionam livremente em qualquer domínio.');
      } else {
        setError(err.message || 'Erro ao processar autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      handleAuthSuccess();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('O domínio de publicação (ex: Netlify) não está autorizado no Google OAuth deste projeto. Para acessar no Netlify, utilize o cadastro/login por E-mail e Senha ou o Modo Visitante.');
      } else {
        setError(err.message || 'Erro ao entrar com Google.');
      }
    }
  };

  const handleGuest = async () => {
    setError(null);
    try {
      await signInAsGuest();
      handleAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como visitante.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {mode === 'login' && 'Entrar no Meu QR-code'}
            {mode === 'register' && 'Criar Conta Gratuita'}
            {mode === 'forgot' && 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Acesse seus QR Codes dinâmicos e analytics'}
            {mode === 'register' && 'Gere QR Codes estáticos e dinâmicos ilimitados'}
            {mode === 'forgot' && 'Digite seu e-mail para receber as instruções'}
          </p>
        </div>

        {/* Google Sign In Button */}
        {mode !== 'forgot' && (
          <div className="space-y-3 mb-6">
            <button
              id="btn-login-google"
              onClick={handleGoogle}
              type="button"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.6.4-2.4L1.6 7C.6 9 .6 11.4.6 13.7c0 2.3.6 4.7 1.6 6.7l3.7-3.1c-.4-.9-.6-1.7-.6-2.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.1L1.6 16.3C3.5 20.2 7.4 23 12 23z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="flex items-center gap-3 text-slate-600 text-xs my-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span>ou via e-mail</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Seu Nome</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo ou empresa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-400">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Entrar na Conta'}
                  {mode === 'register' && 'Criar Conta'}
                  {mode === 'forgot' && 'Enviar E-mail de Recuperação'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode Links */}
        <div className="mt-5 text-center text-xs text-slate-400 space-y-2">
          {mode === 'login' && (
            <p>
              Não tem uma conta?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Já possui conta?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Faça login
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-emerald-400 font-semibold hover:underline"
            >
              Voltar ao login
            </button>
          )}

          {/* Quick guest mode button */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGuest}
              className="text-slate-400 hover:text-slate-200 text-xs font-medium inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Continuar instantaneamente em modo visitante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
