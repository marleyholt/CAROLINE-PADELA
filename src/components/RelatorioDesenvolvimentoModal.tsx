import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Activity,
  HeartPulse,
  Camera,
  Scale,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
  OpcoesRelatorioDesenvolvimento,
} from '../types';
import {
  baixarRelatorioDesenvolvimentoPDF,
  enviarRelatorioDesenvolvimentoWhatsAppComPDF,
} from '../services/pdfGenerator';
import { Send } from 'lucide-react';

interface RelatorioDesenvolvimentoModalProps {
  paciente: Paciente;
  evolucoes: EvolucaoClinica[];
  configClinica: ConfiguracaoClinica;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const RelatorioDesenvolvimentoModal: React.FC<RelatorioDesenvolvimentoModalProps> = ({
  paciente,
  evolucoes,
  configClinica,
  onClose,
  onShowToast,
}) => {
  // Gera o texto inicial dinâmico da Síntese com base na ficha cadastral
  const gerarSintesePadrao = (): string => {
    const partes: string[] = [];

    if (paciente.queixaInicial && paciente.queixaInicial.trim()) {
      partes.push(`Queixa Principal: ${paciente.queixaInicial}.`);
    }

    if (paciente.historicoMedico && paciente.historicoMedico.trim()) {
      partes.push(`Histórico Clínico & Cirúrgico: ${paciente.historicoMedico}.`);
    }

    if (paciente.medicacoesUso && paciente.medicacoesUso.trim()) {
      partes.push(`Medicações em uso: ${paciente.medicacoesUso}.`);
    }

    if (paciente.contraindicacoesAlergias && paciente.contraindicacoesAlergias.trim()) {
      partes.push(`Alergias / Restrições: ${paciente.contraindicacoesAlergias}.`);
    }

    if (paciente.nivelAtividadeFisica) {
      partes.push(`Nível de atividade física: ${paciente.nivelAtividadeFisica}.`);
    }

    if (partes.length === 0) {
      return 'Paciente em acompanhamento terapêutico contínuo com foco em descompressão tecidual, alívio de tensões posturais e restabelecimento do equilíbrio musculoesquelético.';
    }

    return partes.join(' ');
  };

  const gerarConclusaoPadrao = (): string => {
    const totalSessoes = evolucoes.length;
    return `O paciente demonstra excelente adesão ao plano de tratamento ao longo de ${totalSessoes} sessão(ões), com redução expressiva dos níveis de dor na escala EVA, relaxamento do tônus muscular e aumento relevante na amplitude de movimento. Recomenda-se a continuidade das sessões para consolidação postural e manutenção preventiva.`;
  };

  const [sinteseInicial, setSinteseInicial] = useState<string>(gerarSintesePadrao());
  const [conclusaoTerapeutica, setConclusaoTerapeutica] = useState<string>(gerarConclusaoPadrao());
  const [incluirFotos, setIncluirFotos] = useState<boolean>(true);

  // Calcula estatísticas de perda de massa e medidas
  const sessoesComPeso = evolucoes.filter(
    (e) => e.pesoKg !== undefined || e.pesoFinalSessaoKg !== undefined
  );

  let perdaLiquidaTotalGramas = 0;
  let totalPerdasCalculadas = 0;

  evolucoes.forEach((e) => {
    if (e.pesoKg && e.pesoFinalSessaoKg) {
      const pIni = parseFloat(e.pesoKg.toString().replace(',', '.'));
      const pFim = parseFloat(e.pesoFinalSessaoKg.toString().replace(',', '.'));
      if (!isNaN(pIni) && !isNaN(pFim) && pIni > pFim) {
        perdaLiquidaTotalGramas += Math.round((pIni - pFim) * 1000);
        totalPerdasCalculadas++;
      }
    }
  });

  // Total de comparativos visuais
  const totalComparativos = evolucoes.reduce(
    (acc, e) => acc + (e.comparativosVisuais?.length || 0),
    0
  );

  const handleGerarPDF = () => {
    const opcoes: OpcoesRelatorioDesenvolvimento = {
      sinteseInicial,
      conclusaoTerapeutica,
      incluirFotosAntesDepois: incluirFotos,
    };

    baixarRelatorioDesenvolvimentoPDF(paciente, evolucoes, configClinica, opcoes);
    onShowToast(
      'Relatório de Desenvolvimento Gerado!',
      'Documento em PDF baixado com histórico, evolução corporal e comparativos visuais.',
      'success'
    );
    onClose();
  };

  const handleEnviarWhatsApp = () => {
    const opcoes: OpcoesRelatorioDesenvolvimento = {
      sinteseInicial,
      conclusaoTerapeutica,
      incluirFotosAntesDepois: incluirFotos,
    };

    enviarRelatorioDesenvolvimentoWhatsAppComPDF(paciente, evolucoes, configClinica, opcoes, onShowToast);
    onClose();
  };

  return (
    <div
      id="modal-relatorio-desenvolvimento"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-3 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Emitir Relatório de Desenvolvimento do Paciente
                </h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded font-mono">
                  Multi-Sessões
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paciente: <strong className="text-white">{paciente.nome}</strong> • {evolucoes.length} sessão(ões) registradas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Card de Resumo de Indicadores e Drenagem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                Total de Sessões
              </span>
              <p className="text-base font-bold text-slate-900">{evolucoes.length} Atendimentos</p>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-0.5">
              <span className="text-[11px] font-semibold text-sky-800 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-sky-700" />
                Perda Líquida Acumulada
              </span>
              <p className="text-base font-bold text-sky-950">
                {perdaLiquidaTotalGramas > 0
                  ? `💧 -${(perdaLiquidaTotalGramas / 1000).toFixed(2)} kg (-${perdaLiquidaTotalGramas}g)`
                  : 'N/D'}
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-0.5">
              <span className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-teal-700" />
                Comparativos de Fotos
              </span>
              <p className="text-base font-bold text-teal-950">
                {totalComparativos} Pares (Antes & Depois)
              </p>
            </div>
          </div>

          {/* Destaque de Evolução Antropométrica (Drenagem / Medidas) se houver */}
          {sessoesComPeso.length > 0 && (
            <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-sky-700" />
                  Evolução Antropométrica & Perda de Líquidos por Sessão
                </span>
                <span className="text-[10px] text-sky-800 font-semibold bg-sky-100 px-2 py-0.5 rounded">
                  Incluído no PDF
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {sessoesComPeso.map((sessao, idx) => {
                  const pIni = sessao.pesoKg ? parseFloat(sessao.pesoKg.toString().replace(',', '.')) : null;
                  const pFim = sessao.pesoFinalSessaoKg ? parseFloat(sessao.pesoFinalSessaoKg.toString().replace(',', '.')) : null;
                  const dif = pIni && pFim ? pIni - pFim : null;

                  return (
                    <div
                      key={sessao.id || idx}
                      className="bg-white p-2 rounded-md border border-sky-100 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {new Date(sessao.dataSessao + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-slate-500">• {sessao.procedimentoRealizado}</span>
                      </div>

                      <div className="flex items-center gap-2.5 font-mono text-[11px]">
                        {pIni && <span>Inicial: <strong>{pIni} kg</strong></span>}
                        {pFim && <span>Final: <strong>{pFim} kg</strong></span>}
                        {dif !== null && dif > 0 && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            💧 -{dif.toFixed(2)} kg (-{Math.round(dif * 1000)}g)
                          </span>
                        )}
                        {sessao.circunferenciaCm && (
                          <span className="text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded">
                            📏 {sessao.circunferenciaCm}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campo 1: Síntese Inicial do Paciente (Editável) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                1. Síntese Inicial do Paciente (Anamnese Base)
              </label>
              <button
                type="button"
                onClick={() => setSinteseInicial(gerarSintesePadrao())}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                title="Recarregar dados originais da ficha cadastral do paciente"
              >
                ↻ Restaurar da Ficha
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              O sistema pré-carregou a queixa inicial, histórico de cirurgias, medicamentos e dados de anamnese. Você pode editar ou complementar livremente o texto abaixo:
            </p>
            <textarea
              rows={3}
              value={sinteseInicial}
              onChange={(e) => setSinteseInicial(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 leading-relaxed font-normal"
              placeholder="Descreva a queixa principal inicial, histórico de cirurgias e restrições clínicas..."
            />
          </div>

          {/* Campo 2: Conclusão Terapêutica & Próximas Recomendações (Editável) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                2. Conclusão Terapêutica & Próximas Recomendações
              </label>
              <button
                type="button"
                onClick={() => setConclusaoTerapeutica(gerarConclusaoPadrao())}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                title="Restaurar parecer sugerido padrão"
              >
                ↻ Restaurar Padrão
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Parecer conclusivo do terapeuta sobre a resposta clínica, alívio de dores, postura e recomendações para as próximas etapas:
            </p>
            <textarea
              rows={3}
              value={conclusaoTerapeutica}
              onChange={(e) => setConclusaoTerapeutica(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 leading-relaxed font-normal"
              placeholder="Descreva as conclusões clínicas e orientações para o paciente..."
            />
          </div>

          {/* Opção de incluir fotos de Antes e Depois */}
          {totalComparativos > 0 && (
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  Incluir Comparativos Visuais (Fotos de Antes e Depois) no Relatório
                </span>
                <p className="text-[11px] text-teal-800">
                  {totalComparativos} par(es) de fotos serão anexados lado a lado com suas legendas no final do documento em PDF.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirFotos}
                  onChange={(e) => setIncluirFotos(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              id="btn-confirmar-geracao-relatorio-pdf"
              onClick={handleGerarPDF}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar Relatório (PDF)</span>
            </button>

            <button
              type="button"
              id="btn-enviar-relatorio-whats-pdf"
              onClick={handleEnviarWhatsApp}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar WhatsApp com PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
