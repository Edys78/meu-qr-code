import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeByShortCode, recordScanEvent } from '@/lib/firestore-service';
import { parseUserAgent } from '@/lib/user-agent';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await context.params;

  if (!shortCode || shortCode.length < 2) {
    return new NextResponse('Código de QR Code inválido.', { status: 400 });
  }

  try {
    const qr = await getQRCodeByShortCode(shortCode);

    if (!qr) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Não Encontrado | Meu QR-code</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
          <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
            <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 class="text-2xl font-bold mb-2">QR Code não encontrado</h1>
            <p class="text-slate-400 text-sm mb-6 leading-relaxed">
              O link curto <strong>/r/${shortCode}</strong> não existe ou foi removido pelo criador.
            </p>
            <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg">
              Conhecer Meu QR-code
            </a>
          </div>
        </body>
        </html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    if (!qr.isActive) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Pausado | Meu QR-code</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
          <div class="max-w-md w-full bg-slate-800 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl">
            <div class="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ⏸
            </div>
            <h1 class="text-2xl font-bold mb-2">QR Code Temporariamente Pausado</h1>
            <p class="text-slate-400 text-sm mb-6 leading-relaxed">
              O proprietário de <strong>${qr.name}</strong> pausou este destino temporariamente. Tente novamente mais tarde.
            </p>
            <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-all">
              Criar meu próprio QR Code
            </a>
          </div>
        </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Capture User-Agent and Geo for non-blocking analytics
    const uaHeader = request.headers.get('user-agent') || '';
    const parsedUA = parseUserAgent(uaHeader);
    const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'Brasil';
    const city = request.headers.get('x-vercel-ip-city') || 'São Paulo';
    const referer = request.headers.get('referer') || 'Direto';

    // Record scan asynchronously (fire & forget, non-blocking redirect)
    recordScanEvent(qr, {
      deviceType: parsedUA.deviceType,
      os: parsedUA.os,
      browser: parsedUA.browser,
      country,
      city,
      referer,
    }).catch(err => console.error('Error logging scan analytics:', err));

    // If it's a dedicated PIX page or targetUrl is set
    let target = qr.targetUrl;

    if (qr.type === 'pix' && qr.pixData) {
      // Redirect to the rich PIX Copia e Cola mobile web page
      const origin = request.nextUrl.origin;
      return NextResponse.redirect(new URL(`/p/${shortCode}`, origin), { status: 302 });
    }

    // Sanitize destination URL to prevent protocol injection
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    // Fast HTTP 302 Temporary Redirect
    return NextResponse.redirect(new URL(target), {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Redirect engine error:', error);
    return new NextResponse('Erro interno ao processar redirecionamento.', { status: 500 });
  }
}
