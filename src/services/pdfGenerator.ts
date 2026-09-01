import jsPDF from 'jspdf';
import { ConfiguracaoClinica, EvolucaoClinica, Paciente } from '../types';
import { formatarDataBR } from '../utils/dateUtils';

/**
 * Gera a imagem em alta resolução da assinatura manuscrita oficial da terapeuta idêntica à imagem
 */
function gerarAssinaturaManuscritaDataUrl(nomeTerapeuta: string = 'Caroline Padela'): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurações de traço fluido da caneta tinteiro
    ctx.strokeStyle = '#111613';
    ctx.fillStyle = '#111613';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // -------------------------------------------------------------
    // "Caroline" (Caligrafia cursiva fluida)
    // -------------------------------------------------------------
    // Letra C maiúscula elegante com laço superior característico
    ctx.beginPath();
    ctx.moveTo(175, 125);
    ctx.bezierCurveTo(155, 95, 140, 55, 185, 40);
    ctx.bezierCurveTo(220, 30, 245, 48, 235, 85);
    ctx.bezierCurveTo(225, 125, 170, 145, 155, 150);
    ctx.bezierCurveTo(140, 155, 150, 172, 180, 168);
    ctx.bezierCurveTo(200, 165, 218, 152, 230, 140);
    ctx.stroke();

    // "a"
    ctx.beginPath();
    ctx.moveTo(230, 140);
    ctx.bezierCurveTo(242, 124, 256, 126, 252, 148);
    ctx.bezierCurveTo(248, 162, 268, 160, 272, 140);
    // "r"
    ctx.bezierCurveTo(278, 126, 288, 126, 292, 142);
    // "o"
    ctx.bezierCurveTo(300, 126, 318, 126, 314, 148);
    ctx.bezierCurveTo(310, 162, 324, 142, 330, 136);
    // "l" (haste alta curvada)
    ctx.bezierCurveTo(342, 85, 352, 60, 355, 58);
    ctx.bezierCurveTo(358, 55, 348, 75, 346, 154);
    // "i"
    ctx.bezierCurveTo(352, 136, 365, 134, 368, 150);
    // "n"
    ctx.bezierCurveTo(374, 134, 385, 134, 386, 150);
    ctx.bezierCurveTo(392, 134, 404, 134, 406, 148);
    // "e"
    ctx.bezierCurveTo(414, 134, 428, 134, 424, 152);
    ctx.stroke();

    // Pingo no "i"
    ctx.beginPath();
    ctx.arc(364, 114, 3, 0, Math.PI * 2);
    ctx.fill();

    // -------------------------------------------------------------
    // "Padela" com a descida longa e marcante do "P"
    // -------------------------------------------------------------
    // Laço superior do P
    ctx.beginPath();
    ctx.moveTo(435, 78);
    ctx.bezierCurveTo(465, 48, 520, 52, 510, 95);
    ctx.bezierCurveTo(500, 138, 440, 138, 432, 130);
    ctx.stroke();

    // Traço descendente longo e expressivo do P que cruza a linha verde
    ctx.beginPath();
    ctx.lineWidth = 4.2;
    ctx.moveTo(468, 55);
    ctx.bezierCurveTo(458, 115, 438, 195, 416, 255);
    ctx.stroke();

    // Reset largura de traço para as demais letras de "adela"
    ctx.lineWidth = 3.6;

    // "adela"
    ctx.beginPath();
    ctx.moveTo(442, 134);
    // "a"
    ctx.bezierCurveTo(454, 120, 470, 122, 465, 146);
    ctx.bezierCurveTo(460, 162, 480, 156, 484, 136);
    // "d" com haste alta
    ctx.bezierCurveTo(494, 120, 508, 122, 504, 146);
    ctx.bezierCurveTo(510, 95, 520, 68, 522, 65);
    ctx.bezierCurveTo(524, 68, 514, 120, 520, 154);
    // "e"
    ctx.bezierCurveTo(530, 134, 545, 134, 540, 150);
    // "l" com haste alta
    ctx.bezierCurveTo(550, 85, 560, 62, 562, 60);
    ctx.bezierCurveTo(564, 65, 554, 115, 558, 154);
    // "a" final com cauda fluida estendida
    ctx.bezierCurveTo(568, 134, 584, 134, 580, 148);
    ctx.bezierCurveTo(578, 160, 594, 156, 625, 146);
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

  // 3. Informações de Contato à Direita no Cabeçalho Preto (Telefone, E-mail, Instagram)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const telefone = (clinica.telefone || clinica.whatsapp || '(21) 97513-4597').trim();
  const email = (clinica.email || 'contato@carolinepadela.com.br').trim();
  const rawInsta = (clinica.instagram || '@carolpadela').trim();
  const instagram = rawInsta ? (rawInsta.startsWith('@') ? rawInsta : `@${rawInsta}`) : '';

  let currentY = 10.5;
  if (telefone) {
    doc.text(telefone, pageWidth - 14, currentY, { align: 'right' });
    currentY += 5.5;
  }
  if (email) {
    doc.text(email, pageWidth - 14, currentY, { align: 'right' });
    currentY += 5.5;
  }
  if (instagram) {
    doc.text(instagram, pageWidth - 14, currentY, { align: 'right' });
  }
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
 * Converte cor hexadecimal (#RRGGBB) para valores RGB numéricos
 */
function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [237, 241, 235]; // Padrão sálvia suave #EDF1EB
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return [237, 241, 235];
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 237 : r, isNaN(g) ? 241 : g, isNaN(b) ? 235 : b];
}

/**
 * Desenha o rodapé oficial com assinatura da terapeuta idêntico à imagem enviada ou usando imagem enviada pelo usuário
 */
function desenharRodapeOficial(doc: jsPDF, pageWidth: number, pageHeight: number, clinica: ConfiguracaoClinica) {
  const rodapeHeight = 34;
  const rodapeY = pageHeight - rodapeHeight;

  // Cor de fundo do rodapé: atualizada para coincidir com a cor de fundo da imagem de assinatura enviada
  const [bgR, bgG, bgB] = hexToRgb(clinica.assinaturaBgColor || '#EDF1EB');
  doc.setFillColor(bgR, bgG, bgB);
  doc.rect(0, rodapeY, pageWidth, rodapeHeight, 'F');

  const centerX = pageWidth / 2;
  const lineY = rodapeY + 17;

  // Se o usuário enviou uma imagem de assinatura personalizada nas configurações
  if (clinica.assinaturaUrl) {
    try {
      const imgWidth = 86;
      const imgHeight = 28;
      const imgX = centerX - (imgWidth / 2);
      const imgY = rodapeY + (rodapeHeight - imgHeight) / 2;
      const format = clinica.assinaturaUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(clinica.assinaturaUrl, format, imgX, imgY, imgWidth, imgHeight);
      return;
    } catch (err) {
      console.warn('Erro ao inserir imagem de assinatura no PDF:', err);
    }
  }

  // Se não houver imagem personalizada enviada, usa o layout padrão idêntico à imagem enviada
  // Linha horizontal verde sálvia (#8FA393) cruzando a assinatura
  doc.setDrawColor(143, 163, 147);
  doc.setLineWidth(0.48);
  doc.line(centerX - 62, lineY, centerX + 62, lineY);

  // Assinatura manuscrita fluida (vetorial / canvas de alta definição)
  const assinaturaDataUrl = gerarAssinaturaManuscritaDataUrl(clinica.nomeTerapeuta || 'Caroline Padela');
  if (assinaturaDataUrl) {
    try {
      // Estampa a assinatura centralizada exatamente sobre a linha conforme a imagem
      doc.addImage(assinaturaDataUrl, 'PNG', centerX - 36, lineY - 15, 72, 22);
    } catch {
      // Fallback tipográfico
      doc.setTextColor(17, 22, 19);
      doc.setFont('times', 'italic');
      doc.setFontSize(21);
      doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY - 1, { align: 'center' });
    }
  } else {
    doc.setTextColor(17, 22, 19);
    doc.setFont('times', 'italic');
    doc.setFontSize(21);
    doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY - 1, { align: 'center' });
  }

  // Nome impresso limpo em sálvia escuro embaixo da linha (idêntico à imagem)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(93, 124, 113);
  doc.text(clinica.nomeTerapeuta || 'Caroline Padela', centerX, lineY + 6.8, { align: 'center' });
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

  // 1. Marca d'água removida para manter fundo limpo e alta legibilidade
  // desenharMarcaDagua desativada a pedido

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

  // 1. Marca d'água removida para manter fundo limpo e alta legibilidade
  // desenharMarcaDagua desativada a pedido

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
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMsg = encodeURIComponent(mensagem);
  const url = `https://wa.me/${finalPhone}?text=${encodedMsg}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
