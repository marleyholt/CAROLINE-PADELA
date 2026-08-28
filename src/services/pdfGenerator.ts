import jsPDF from 'jspdf';
import { ConfiguracaoClinica, EvolucaoClinica, Paciente } from '../types';
import { formatarDataBR } from '../utils/dateUtils';

export function gerarRelatorioEvolucaoPDF(
  evolucao: EvolucaoClinica,
  paciente: Paciente,
  clinica: ConfiguracaoClinica
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- 1. MARCA D'ÁGUA EM TODA A PÁGINA ---
  doc.saveGraphicsState();
  doc.setTextColor(230, 235, 235);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  
  // Diagonal watermark
  const watermarkText = clinica.textoMarcaDagua || 'RELATÓRIO CLÍNICO DE EVOLUÇÃO • CONFIDENCIAL';
  doc.text(watermarkText, pageWidth / 2, pageHeight / 2 + 10, {
    align: 'center',
    angle: 45,
  });
  doc.restoreGraphicsState();

  // --- 2. CABEÇALHO CLÍNICO / TIMBRADO ---
  // Background bar for header
  doc.setFillColor(245, 248, 246);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');
  
  // Left decorative accent bar (Sage green)
  doc.setFillColor(16, 140, 100);
  doc.roundedRect(margin, y, 4, 32, 1, 1, 'F');

  // Clinic title & info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 50, 40);
  doc.text(clinica.nomeClinica || 'Espaço Terapêutico & Bem-Estar', margin + 8, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 90, 85);
  doc.text(`${clinica.nomeTerapeuta} • ${clinica.registroProfissional}`, margin + 8, y + 14);
  doc.text(`${clinica.especialidade}`, margin + 8, y + 19);
  doc.text(`${clinica.endereco} • ${clinica.cidadeUf}`, margin + 8, y + 24);
  doc.text(`WhatsApp: ${clinica.whatsapp} • CNPJ/CPF: ${clinica.cnpjCpf}`, margin + 8, y + 29);

  // Badge tipo de documento no topo direito
  doc.setFillColor(16, 140, 100);
  doc.roundedRect(pageWidth - margin - 45, y + 6, 40, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PRONTUÁRIO CLÍNICO', pageWidth - margin - 25, y + 11, { align: 'center' });

  y += 38;

  // --- 3. DADOS DO PACIENTE & SESSÃO ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 230, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 50, 40);
  doc.text('DADOS DO PACIENTE & ATENDIMENTO', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 70);

  const col1 = margin + 4;
  const col2 = margin + 85;

  doc.text(`Paciente: `, col1, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(paciente.nome, col1 + 16, y + 12);
  doc.setFont('helvetica', 'normal');

  doc.text(`Data da Sessão: `, col2, y + 12);
  doc.setFont('helvetica', 'bold');
  const dataFormatada = formatarDataBR(evolucao.dataSessao);
  doc.text(dataFormatada, col2 + 25, y + 12);
  doc.setFont('helvetica', 'normal');

  doc.text(`CPF: ${paciente.cpf || 'Não informado'}   |   Profissão: ${paciente.profissao || 'Não informada'}`, col1, y + 18);
  doc.text(`Procedimento: `, col2, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 140, 100);
  doc.text(evolucao.procedimentoRealizado, col2 + 25, y + 18);
  doc.setTextColor(60, 70, 70);
  doc.setFont('helvetica', 'normal');

  y += 29;

  // --- 4. ESCALA DE DOR (EVA) & REGIÕES TRABALHADAS ---
  doc.setFillColor(248, 250, 249);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 40);
  doc.text('AVALIAÇÃO ANALÓGICA DE DOR (ESCALA EVA 0-10)', margin + 4, y + 6);

  // Box EVA Inicial
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin + 4, y + 9, 38, 13, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('Dor Inicial (Chegada):', margin + 6, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${evolucao.evaInicial} / 10`, margin + 23, y + 20, { align: 'center' });

  // Arrow / Indicator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 140, 100);
  doc.text('➔', margin + 46, y + 18);

  // Box EVA Final
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(110, 231, 183);
  doc.roundedRect(margin + 52, y + 9, 38, 13, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('Dor Final (Pós-Sessão):', margin + 54, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${evolucao.evaFinal} / 10`, margin + 71, y + 20, { align: 'center' });

  // Melhora calculada
  const reducaoDor = evolucao.evaInicial > 0 
    ? Math.round(((evolucao.evaInicial - evolucao.evaFinal) / evolucao.evaInicial) * 100)
    : 0;

  doc.setFillColor(16, 140, 100);
  doc.roundedRect(margin + 94, y + 9, 32, 13, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Alívio Relatado:', margin + 110, y + 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`${reducaoDor >= 0 ? `-${reducaoDor}%` : 'Estável'}`, margin + 110, y + 20, { align: 'center' });

  // Regiões trabalhadas text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 90, 85);
  doc.text('Áreas Tratadas:', margin + 130, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const areasText = evolucao.regioesTrabalhadas.join(', ') || 'Corpo todo';
  const splitAreas = doc.splitTextToSize(areasText, 40);
  doc.text(splitAreas, margin + 130, y + 18);

  y += 31;

  // --- 5. SEÇÕES DESCRITIVAS DA EVOLUÇÃO ---
  const sections = [
    {
      titulo: '1. QUEIXA PRINCIPAL & QUADRO CLÍNICO RELATADO',
      conteudo: evolucao.queixaPrincipal,
      cor: [20, 50, 40],
    },
    {
      titulo: '2. MANOBRAS, TÉCNICAS E CONDUTAS TERAPÊUTICAS REALIZADAS',
      conteudo: evolucao.manobrasAplicadas,
      cor: [20, 50, 40],
    },
    {
      titulo: '3. RESPOSTA TECIDUAL, MOBILIDADE E OBSERVAÇÕES CLÍNICAS',
      conteudo: evolucao.reacaoTecidual + (evolucao.observacoesGerais ? `\n${evolucao.observacoesGerais}` : ''),
      cor: [20, 50, 40],
    },
    {
      titulo: '4. ORIENTAÇÕES DE AUTOCUIDADO & CONDUTA DOMICILIAR',
      conteudo: evolucao.orientacoesCasa,
      cor: [16, 140, 100],
      destaque: true,
    },
  ];

  sections.forEach((sec) => {
    // Section Header
    if (sec.destaque) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(sec.cor[0], sec.cor[1], sec.cor[2]);
    doc.text(sec.titulo, margin, y);
    y += 4;

    // Content box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const lines = doc.splitTextToSize(sec.conteudo || 'Sem anotações complementares.', contentWidth - 8);
    const boxHeight = Math.max(lines.length * 4.5 + 6, 14);

    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');
    doc.text(lines, margin + 4, y + 5);

    y += boxHeight + 5;
  });

  // Próxima sessão recomendada
  if (evolucao.proximaSessaoRecomendada) {
    const dataProx = new Date(evolucao.proximaSessaoRecomendada + 'T12:00:00Z').toLocaleDateString('pt-BR');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 140, 100);
    doc.text(`* Retorno / Próxima sessão sugerida: ${dataProx}`, margin, y);
    y += 7;
  }

  // --- 6. RODAPÉ E ASSINATURA ---
  const signY = pageHeight - 32;
  
  // Linha de assinatura
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, signY, pageWidth / 2 + 40, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(clinica.nomeTerapeuta, pageWidth / 2, signY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(clinica.registroProfissional, pageWidth / 2, signY + 8.5, { align: 'center' });
  doc.text(`${clinica.especialidade}`, pageWidth / 2, signY + 12.5, { align: 'center' });

  // Carimbo de data de emissão
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const dataHoje = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Documento emitido digitalmente em ${dataHoje} • Válido para acompanhamento terapêutico.`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  return doc;
}

export function baixarRelatorioPDF(
  evolucao: EvolucaoClinica,
  paciente: Paciente,
  clinica: ConfiguracaoClinica
): void {
  const doc = gerarRelatorioEvolucaoPDF(evolucao, paciente, clinica);
  const nomeSanitizado = paciente.nome.replace(/[^a-zA-Z0-9]/g, '_');
  const dataStr = evolucao.dataSessao;
  doc.save(`Evolucao_Clinica_${nomeSanitizado}_${dataStr}.pdf`);
}

export function gerarTextoWhatsAppEvolucao(
  evolucao: EvolucaoClinica,
  paciente: Paciente,
  clinica: ConfiguracaoClinica
): string {
  const dataFormatada = formatarDataBR(evolucao.dataSessao);
  const primeiroNome = paciente.nome.split(' ')[0];

  return `🌿 *${clinica.nomeClinica}*
*Relatório de Atendimento & Evolução Clínica*

Olá, *${primeiroNome}*! Tudo bem?
Aqui é a *${clinica.nomeTerapeuta}* (${clinica.registroProfissional}).

Fiz o registro detalhado da nossa sessão de hoje (*${dataFormatada}*) de *${evolucao.procedimentoRealizado}*.

📊 *Resumo da sua evolução:*
• Dor inicial: ${evolucao.evaInicial}/10 ➔ Dor final: ${evolucao.evaFinal}/10
• Áreas trabalhadas: ${evolucao.regioesTrabalhadas.join(', ') || 'Corpo todo'}

💧 *Orientações importantes de autocuidado para hoje/amanhã:*
${evolucao.orientacoesCasa}

${evolucao.proximaSessaoRecomendada ? `🗓️ *Sugestão de retorno:* ${formatarDataBR(evolucao.proximaSessaoRecomendada)}\n` : ''}
📄 *O seu relatório completo em PDF com o prontuário foi gerado no sistema e já está disponível.*

Muito obrigada pela confiança e cuide-se bem! Qualquer dúvida ou sensação diferente, estou à disposição no WhatsApp. ✨`;
}

export function abrirWhatsAppComTexto(telefone: string, mensagem: string): void {
  const cleanPhone = telefone.replace(/\D/g, '');
  // Adiciona código do país 55 se não tiver
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMsg = encodeURIComponent(mensagem);
  const url = `https://wa.me/${finalPhone}?text=${encodedMsg}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
