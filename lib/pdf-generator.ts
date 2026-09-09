import { jsPDF } from 'jspdf';

export interface PDFOptions {
  title?: string;
  author?: string;
  sourceQRName?: string;
  date?: string;
}

/**
 * Generates and downloads a clean formatted PDF document from free text content.
 */
export function downloadTextAsPDF(textContent: string, options?: PDFOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header background banner
  doc.setFillColor(7, 10, 20); // Dark sleek header
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Accent line
  doc.setFillColor(0, 245, 212); // Neon cyan line
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Meu QR-code', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text('Documento e Leitura de Mensagem de Texto', margin, 20);

  // Date / Timestamp (Top right)
  const now = new Date();
  const formattedDate = options?.date || now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFontSize(8);
  doc.setTextColor(140, 160, 185);
  doc.text(`Gerado em: ${formattedDate}`, pageWidth - margin, 18, { align: 'right' });

  // Document Title (Optional or default)
  let currentY = 40;
  const docTitle = options?.title || options?.sourceQRName || 'Conteúdo do Texto';
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, margin, currentY);
  currentY += 8;

  // Metadata block (word count, chars)
  const wordsCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Estatísticas: ${wordsCount} palavras • ${charCount} caracteres`, margin, currentY);
  currentY += 10;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Body Text with auto-wrapping & pagination
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);

  const splitText = doc.splitTextToSize(textContent || '(Sem conteúdo de texto)', contentWidth);
  const lineHeight = 6.5;

  for (let i = 0; i < splitText.length; i++) {
    // If approaching page bottom, add a new page
    if (currentY > pageHeight - margin - 15) {
      // Footer before creating new page
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Meu QR-code • www.meuqrcode.com.br', margin, pageHeight - 10);
      
      doc.addPage();
      currentY = margin + 10;

      // Small header on subsequent pages
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(docTitle, margin, margin);
      doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
    }

    doc.text(splitText[i], margin, currentY);
    currentY += lineHeight;
  }

  // Footer on final page
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Meu QR-code • Documento exportado diretamente pelo leitor e gerador', margin, pageHeight - 10);
  doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Trigger download
  const safeFilename = (options?.title || 'meu-qrcode-texto')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
  
  doc.save(`${safeFilename || 'mensagem-texto'}.pdf`);
}

/**
 * Creates a Blob URL to preview the PDF in a new tab or iframe
 */
export function getPDFBlobUrl(textContent: string, options?: PDFOptions): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header background banner
  doc.setFillColor(7, 10, 20);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(0, 245, 212);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Meu QR-code', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text('Documento e Leitura de Mensagem de Texto', margin, 20);

  const docTitle = options?.title || 'Leitura de Mensagem';
  let currentY = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, margin, currentY);
  currentY += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);

  const splitText = doc.splitTextToSize(textContent || '(Sem texto)', contentWidth);
  const lineHeight = 6.5;

  for (let i = 0; i < splitText.length; i++) {
    if (currentY > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 10;
    }
    doc.text(splitText[i], margin, currentY);
    currentY += lineHeight;
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
