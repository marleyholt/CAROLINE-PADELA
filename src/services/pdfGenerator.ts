import jsPDF from 'jspdf';
import { ConfiguracaoClinica, EvolucaoClinica, Paciente } from '../types';
import { formatarDataBR } from '../utils/dateUtils';

/**
 * Gera a imagem em alta resolução da assinatura manuscrita oficial da terapeuta (conforme Imagem 2)
 */
function gerarAssinaturaManuscritaDataUrl(nomeTerapeuta: string = 'Caroline Padela'): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cor da tinta da caneta (preto/carvão fluido elegante)
    ctx.strokeStyle = '#181f1b';
    ctx.fillStyle = '#181f1b';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Desenho vetorial da assinatura "Caroline Padela" em traços orgânicos
    // Letra C maiúscula com laço superior
    ctx.beginPath();
    ctx.moveTo(130, 80);
    ctx.bezierCurveTo(115, 60, 100, 35, 125, 25);
    ctx.bezierCurveTo(145, 18, 165, 30, 160, 55);
    ctx.bezierCurveTo(155, 80, 115, 95, 105, 98);
    ctx.bezierCurveTo(95, 102, 105, 115, 125, 112);
    ctx.bezierCurveTo(140, 110, 150, 100, 158, 92);
    ctx.stroke();

    // "aroline"
    ctx.beginPath();
    ctx.moveTo(158, 92);
    // a
    ctx.bezierCurveTo(168, 80, 178, 82, 174, 98);
    ctx.bezierCurveTo(170, 108, 185, 106, 188, 92);
    // r
    ctx.bezierCurveTo(192, 82, 200, 82, 202, 94);
    // o
    ctx.bezierCurveTo(208, 82, 220, 82, 218, 98);
    ctx.bezierCurveTo(216, 108, 226, 94, 230, 90);
    // l
    ctx.bezierCurveTo(238, 55, 245, 40, 246, 38);
    ctx.bezierCurveTo(248, 35, 242, 50, 240, 102);
    // i
    ctx.bezierCurveTo(245, 90, 254, 88, 255, 100);
    // n
    ctx.bezierCurveTo(260, 88, 268, 88, 268, 100);
    ctx.bezierCurveTo(272, 88, 280, 88, 282, 98);
    // e
    ctx.bezierCurveTo(288, 88, 298, 88, 295, 102);
    ctx.stroke();

    // Pingo no i
    ctx.beginPath();
    ctx.arc(252, 74, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // "Padela" com P maiúsculo cursivo que cruza para baixo da linha
    ctx.beginPath();
    // Traço descendente elegante do P
    ctx.moveTo(330, 32);
    ctx.bezierCurveTo(320, 50, 310, 100, 290, 165);
    ctx.stroke();

    // Bojo do P
    ctx.beginPath();
    ctx.moveTo(318, 40);
    ctx.bezierCurveTo(345, 20, 385, 30, 375, 65);
    ctx.bezierCurveTo(365, 95, 315, 95, 308, 90);
    // a
    ctx.bezierCurveTo(320, 78, 332, 80, 328, 96);
    ctx.bezierCurveTo(324, 108, 338, 104, 342, 90);
    // d (com haste alta)
    ctx.bezierCurveTo(350, 78, 360, 80, 356, 96);
    ctx.bezierCurveTo(360, 60, 368, 42, 368, 40);
    ctx.bezierCurveTo(368, 55, 362, 90, 368, 102);
    // e
    ctx.bezierCurveTo(376, 88, 388, 88, 384, 100);
    // l
    ctx.bezierCurveTo(392, 55, 400, 40, 402, 38);
    ctx.bezierCurveTo(404, 42, 396, 75, 400, 102);
    // a final com cauda fluida
    ctx.bezierCurveTo(408, 88, 420, 88, 418, 98);
    ctx.bezierCurveTo(416, 106, 428, 102, 445, 94);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao gerar canvas de assinatura manuscrita:', err);
    return '';
  }
}

/**
 * Desenha o cabeçalho oficial preto idêntico à Imagem 1
 */
function desenharCabecalhoOficial(doc: jsPDF, pageWidth: number, clinica: ConfiguracaoClinica) {
  // 1. Barra superior preta sólida
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // 2. Se houver logo customizado em imagem (png/jpeg) que não seja o padrão, tenta desenhar
  let renderedCustomLogo = false;
  if (clinica.logoUrl && clinica.logoUrl.trim() !== '') {
    try {
      doc.addImage(clinica.logoUrl, 'PNG', 10, 4, 32, 24);
      renderedCustomLogo = true;
    } catch {
      try {
        doc.addImage(clinica.logoUrl, 'JPEG', 10, 4, 32, 24);
        renderedCustomLogo = true;
      } catch {
        renderedCustomLogo = false;
      }
    }
  }

  // Se não houver logo customizado em imagem, renderiza o logotipo CP VETORIAL IDENTICO À IMAGEM 1
  if (!renderedCustomLogo) {
    const greenColor = [13, 128, 85]; // Emerald green rico idêntico ao modelo (#0D8055)
    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);

    // Letra C (Semicírculo verde encorpado)
    doc.setLineWidth(3.2);
    doc.circle(18.5, 14, 6.2, 'S');

    // Abertura do C à direita
    doc.setFillColor(0, 0, 0);
    doc.rect(18.5, 10.5, 8, 7, 'F');

    // Letra P (Haste e laço superior)
    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.setLineWidth(3.0);
    // Haste do P
    doc.line(26.5, 7.8, 26.5, 20.2);
    // Laço superior do P
    doc.line(26.5, 7.8, 31.5, 7.8);
    doc.line(26.5, 14.0, 31.5, 14.0);
    doc.line(31.5, 7.8, 31.5, 14.0);

    // Faixa preta horizontal central cortando o monograma CP
    doc.setFillColor(0, 0, 0);
    doc.rect(11, 13.5, 30, 4.2, 'F');

    // Texto branco "CAROLINE PADELA" no centro da faixa cortada
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const nomeExibir = (clinica.nomeTerapeuta || clinica.nomeClinica || 'CAROLINE PADELA').toUpperCase();
    doc.text(nomeExibir, 13.5, 16.5);

    // Subtítulo branco com espaçamento tracked abaixo do CP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(255, 255, 255);
    doc.text('L I B E R A Ç Ã O   M I O F A S C I A L', 11.5, 23.5);
  }

  // 3. Informações de Contato à Direita no Cabeçalho Preto
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const telefone = clinica.telefone || clinica.whatsapp || '(21) 97513-4597';
  doc.text(telefone, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const social = clinica.email && clinica.email.includes('@') ? clinica.email : '@carolpadela';
  doc.text(social, pageWidth - 14, 19.5, { align: 'right' });
}

/**
 * Desenha a faixa de título verde-oliva sobreposta (Idêntica à Imagem 1)
 */
function desenharFaixaTitulo(doc: jsPDF, pageWidth: number, y: number, linha1: string, linha2: string): number {
  const boxHeight = 16.5;
  const boxWidth = 108;
  const boxX = (pageWidth - boxWidth) / 2;
  const boxY = 23.5; // Sobrepõe 8.5mm da barra preta e avança 8mm na folha

  // Bloco verde oliva idêntico ao da imagem (#42513F)
  doc.setFillColor(66, 81, 63);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(linha1, pageWidth / 2, boxY + 6.5, { align: 'center' });
  doc.text(linha2, pageWidth / 2, boxY + 12.5, { align: 'center' });

  return boxY + boxHeight + 8;
}

/**
 * Desenha o rodapé oficial com assinatura da terapeuta idêntico à Imagem 2
 */
function desenharRodapeOficial(doc: jsPDF, pageWidth: number, pageHeight: number, clinica: ConfiguracaoClinica) {
  const rodapeHeight = 32;
  const rodapeY = pageHeight - rodapeHeight;

  // Fundo bege acinzentado / sálvia suave (#E6EBE4)
  doc.setFillColor(230, 235, 228);
  doc.rect(0, rodapeY, pageWidth, rodapeHeight, 'F');

  const centerX = pageWidth / 2;
  const lineY = rodapeY + 16.5;

  // Linha horizontal sutil verde sálvia (#A3B3A0) cruzando a assinatura
  doc.setDrawColor(163, 179, 160);
  doc.setLineWidth(0.45);
  doc.line(centerX - 55, lineY, centerX + 55, lineY);

  // Assinatura manuscrita fluida (vetorial / canvas de alta definição)
  const assinaturaDataUrl = gerarAssinaturaManuscritaDataUrl(clinica.nomeTerapeuta || 'Caroline Padela');
  if (assinaturaDataUrl) {
    try {
      // Estampa a assinatura centralizada exatamente sobre a linha
      doc.addImage(assinaturaDataUrl, 'PNG', centerX - 32, lineY - 14, 64, 18);
    } catch {
      // Fallback tipográfico
      doc.setTextColor(24, 31, 27);
      doc.setFont('times', 'italic');
      doc.setFontSize(21);
      doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY - 1, { align: 'center' });
    }
  } else {
    doc.setTextColor(24, 31, 27);
    doc.setFont('times', 'italic');
    doc.setFontSize(21);
    doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY - 1, { align: 'center' });
  }

  // Nome impresso limpo em itálico sálvia escuro embaixo da linha (conforme Imagem 2)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(94, 111, 90);
  doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY + 6.2, { align: 'center' });
}

/**
 * Desenha marca d'água sutil no centro da página
 */
function desenharMarcaDagua(doc: jsPDF, pageWidth: number, pageHeight: number, clinica?: ConfiguracaoClinica) {
  doc.saveGraphicsState();
  
  if (clinica?.logoUrl && clinica.logoUrl.trim() !== '') {
    try {
      // Se houver logo customizado, desenha de forma suave
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
      doc.addImage(clinica.logoUrl, 'PNG', pageWidth / 2 - 35, pageHeight / 2 - 45, 70, 70);
    } catch {
      try {
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.addImage(clinica.logoUrl, 'JPEG', pageWidth / 2 - 35, pageHeight / 2 - 45, 70, 70);
      } catch {
        // Fallback para texto
      }
    }
  }

  doc.setTextColor(242, 245, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  const sigla = clinica?.nomeTerapeuta ? clinica.nomeTerapeuta.split(' ').map(n => n[0]).slice(0, 2).join('') : 'CP';
  doc.text(sigla || 'CP', pageWidth / 2, pageHeight / 2 - 10, {
    align: 'center',
  });
  doc.setFontSize(11);
  doc.setTextColor(245, 247, 245);
  const textoDagua = clinica?.textoMarcaDagua || 'CAROLINE PADELA • LIBERAÇÃO MIOFASCIAL';
  doc.text(textoDagua, pageWidth / 2, pageHeight / 2 + 10, {
    align: 'center',
  });
  doc.restoreGraphicsState();
}

/**
 * GERA O RELATÓRIO DE ATENDIMENTO / ANAMNESE (Página Individual da Sessão)
 * Fiel ao modelo oficial fornecido pela Caroline Padela
 */
export function gerarRelatorioEvolucaoPDFNodes(
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

  // 1. Marca d'água de fundo
  desenharMarcaDagua(doc, pageWidth, pageHeight, clinica);

  // 2. Cabeçalho oficial preto
  desenharCabecalhoOficial(doc, pageWidth, clinica);

  // 3. Faixa de título "RELATÓRIO DE ATENDIMENTO"
  let y = desenharFaixaTitulo(doc, pageWidth, 28, 'R E L A T Ó R I O   D E', 'A T E N D I M E N T O');

  // 4. Metadados do Atendimento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 25, 22);

  const dataFormatada = formatarDataBR(evolucao.dataSessao);
  doc.text(`Data: `, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dataFormatada, margin + 11, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Paciente: `, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(paciente.nome, margin + 17, y);

  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 20, 18);
  doc.text('Análise das Observações Clínicas:', margin, y);

  y += 7;

  // Montagem estruturada dos blocos conforme modelo oficial (Sem observações internas / observacoesGerais)
  // Bloco 1: Queixas Principais (Anamnese)
  const textoQueixa = evolucao.queixaPrincipal || 
    (paciente.queixaInicial 
      ? `O paciente buscou atendimento relatando: ${paciente.queixaInicial}` 
      : 'Atendimento preventivo e de manutenção da saúde miofascial e postural.');

  // Bloco 2: Avaliação e Conduta Terapêutica
  let textoConduta = evolucao.manobrasAplicadas;
  if (!textoConduta || textoConduta.trim() === '') {
    textoConduta = `Durante a avaliação física e palpatória, identificou-se tensão muscular e pontos de restrição nas regiões: ${evolucao.regioesTrabalhadas.join(', ') || 'dorso e paravertebrais'}.\nFoi realizado o protocolo de ${evolucao.procedimentoRealizado} com foco em descompressão tecidual e restabelecimento da mobilidade articular.`;
  }

  // Bloco 3: Evolução Imediata (Pós-Sessão) - Observações internas são estritamente excluídas do PDF oficial
  let textoEvolucao = evolucao.reacaoTecidual;
  if (!textoEvolucao || textoEvolucao.trim() === '') {
    textoEvolucao = `O corpo respondeu de forma positiva ao protocolo realizado. Observou-se relaxamento significativo no tônus muscular, aumento da amplitude de movimento e alívio da dor na escala EVA de ${evolucao.evaInicial}/10 para ${evolucao.evaFinal}/10. Resposta circulatória satisfatória para oxigenação do tecido tratado.`;
  }

  const sections = [
    {
      numero: '1. Queixas Principais (Anamnese)',
      texto: textoQueixa,
    },
    {
      numero: '2. Avaliação e Conduta Terapêutica',
      texto: textoConduta,
    },
    {
      numero: '3. Evolução Imediata (Pós-Sessão)',
      texto: textoEvolucao,
    },
  ];

  // Adiciona orientações como 4 caso existam
  if (evolucao.orientacoesCasa && evolucao.orientacoesCasa.trim() !== '') {
    sections.push({
      numero: '4. Orientações de Autocuidado & Conduta Domiciliar',
      texto: evolucao.orientacoesCasa,
    });
  }

  // Renderiza cada seção com tipografia limpa e espaçamento harmônico
  sections.forEach((sec) => {
    // Título da Seção (Negrito)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 20, 18);
    doc.text(sec.numero, margin, y);
    y += 4.5;

    // Corpo do texto (Justificado/Formatado em linhas)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 45, 42);

    const lines = doc.splitTextToSize(sec.texto, contentWidth);
    doc.text(lines, margin, y, { lineHeightFactor: 1.35 });
    
    y += lines.length * 4.2 + 5.5;
  });

  // 5. Rodapé oficial bege
  desenharRodapeOficial(doc, pageWidth, pageHeight, clinica);

  return doc;
}

export function gerarRelatorioEvolucaoPDF(
  evolucao: EvolucaoClinica,
  paciente: Paciente,
  clinica: ConfiguracaoClinica
): jsPDF {
  return gerarRelatorioEvolucaoPDFNodes(evolucao, paciente, clinica);
}

/**
 * GERA O RELATÓRIO GERAL DE DESENVOLVIMENTO & EVOLUÇÃO MULTI-SESSÕES
 * Mantém o mesmo padrão de excelência visual com histórico comparativo
 */
export function gerarRelatorioDesenvolvimentoGeralPDF(
  paciente: Paciente,
  evolucoes: EvolucaoClinica[],
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

  // 1. Marca d'água
  desenharMarcaDagua(doc, pageWidth, pageHeight, clinica);

  // 2. Cabeçalho oficial preto
  desenharCabecalhoOficial(doc, pageWidth, clinica);

  // 3. Faixa de título "RELATÓRIO DE DESENVOLVIMENTO"
  let y = desenharFaixaTitulo(doc, pageWidth, 28, 'R E L A T Ó R I O   D E', 'D E S E N V O L V I M E N T O   C L Í N I C O');

  // 4. Identificação do Paciente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 25, 22);

  const dataHoje = formatarDataBR(new Date().toISOString().split('T')[0]);
  doc.text(`Data de Emissão: `, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dataHoje, margin + 28, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Paciente: `, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(paciente.nome, margin + 17, y);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Sessões Registradas: `, margin + 95, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${evolucoes.length} sessão(ões)`, margin + 145, y);

  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 20, 18);
  doc.text('Análise de Progresso & Acompanhamento Terapêutico:', margin, y);

  y += 7;

  // Seção 1: Quadro Geral & Histórico Inicial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 20, 18);
  doc.text('1. Síntese Inicial do Paciente (Anamnese Base)', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 42);
  const queixaBase = paciente.queixaInicial 
    ? `Queixa primária: ${paciente.queixaInicial}. Histórico médico: ${paciente.historicoMedico || 'Sem comorbidades registradas'}. Nível de atividade física: ${paciente.nivelAtividadeFisica}.`
    : 'Acompanhamento contínuo de manutenção postural, liberação miofascial e alívio de tensões acumuladas.';
  
  const linesQueixa = doc.splitTextToSize(queixaBase, contentWidth);
  doc.text(linesQueixa, margin, y, { lineHeightFactor: 1.35 });
  y += linesQueixa.length * 4.2 + 5.5;

  // Seção 2: Linha do Tempo de Evolução & Respostas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 20, 18);
  doc.text('2. Histórico Cronológico de Atendimentos', margin, y);
  y += 4.5;

  // Lista as sessões ordenadas
  const sessõesOrdenadas = [...evolucoes].sort((a, b) => b.dataSessao.localeCompare(a.dataSessao)).slice(0, 5);

  sessõesOrdenadas.forEach((sessao, idx) => {
    if (y > pageHeight - 45) return; // Limite da página antes do rodapé

    const dataSess = formatarDataBR(sessao.dataSessao);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 80, 60);
    doc.text(`• Sessão ${sessõesOrdenadas.length - idx} (${dataSess}) - ${sessao.procedimentoRealizado}`, margin + 2, y);

    // Dor EVA
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 95);
    doc.text(`Dor EVA: ${sessao.evaInicial}/10 ➔ ${sessao.evaFinal}/10`, margin + 115, y);
    y += 4;

    // Resumo de conduta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 55, 52);
    const resumo = sessao.reacaoTecidual || sessao.manobrasAplicadas || 'Sessão concluída com excelente resposta muscular.';
    const linesRes = doc.splitTextToSize(resumo, contentWidth - 6);
    doc.text(linesRes.slice(0, 2), margin + 4, y, { lineHeightFactor: 1.3 });
    y += Math.min(linesRes.length, 2) * 3.8 + 4;
  });

  // Seção 3: Parecer Geral e Conclusão Terapêutica
  if (y < pageHeight - 55) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 20, 18);
    doc.text('3. Conclusão Terapêutica & Próximas Recomendações', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 45, 42);
    const conclusao = 'O paciente demonstra evolução contínua, com aumento de flexibilidade, desativação de pontos de tensão e ganho expressivo de qualidade de vida. Recomenda-se a continuidade das sessões para manutenção do equilíbrio biomecânico e prevenção de recidivas de dor.';
    const linesConc = doc.splitTextToSize(conclusao, contentWidth);
    doc.text(linesConc, margin, y, { lineHeightFactor: 1.35 });
  }

  // 5. Rodapé oficial
  desenharRodapeOficial(doc, pageWidth, pageHeight, clinica);

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
  doc.save(`Relatorio_Atendimento_${nomeSanitizado}_${dataStr}.pdf`);
}

export function baixarRelatorioDesenvolvimentoPDF(
  paciente: Paciente,
  evolucoes: EvolucaoClinica[],
  clinica: ConfiguracaoClinica
): void {
  const doc = gerarRelatorioDesenvolvimentoGeralPDF(paciente, evolucoes, clinica);
  const nomeSanitizado = paciente.nome.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Relatorio_Desenvolvimento_${nomeSanitizado}.pdf`);
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
Aqui é a *${clinica.nomeTerapeuta}* (@carolpadela).

Fiz o registro detalhado da nossa sessão de hoje (*${dataFormatada}*) de *${evolucao.procedimentoRealizado}*.

📊 *Resumo da sua evolução:*
• Dor inicial: ${evolucao.evaInicial}/10 ➔ Dor final: ${evolucao.evaFinal}/10
• Áreas trabalhadas: ${evolucao.regioesTrabalhadas.join(', ') || 'Corpo todo'}

💧 *Orientações importantes de autocuidado para hoje/amanhã:*
${evolucao.orientacoesCasa}

${evolucao.proximaSessaoRecomendada ? `🗓️ *Sugestão de retorno:* ${formatarDataBR(evolucao.proximaSessaoRecomendada)}\n` : ''}
📄 *O seu Relatório de Atendimento oficial em PDF com o prontuário foi gerado no sistema e já está disponível.*

Muito obrigada pela confiança e cuide-se bem! Qualquer dúvida ou sensação diferente, estou à disposição no WhatsApp (21) 97513-4597. ✨`;
}

export function abrirWhatsAppComTexto(telefone: string, mensagem: string): void {
  const cleanPhone = telefone.replace(/\D/g, '');
  const finalPhone到位 = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMsg = encodeURIComponent(mensagem);
  const url = `https://wa.me/${finalPhone到位}?text=${encodedMsg}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
