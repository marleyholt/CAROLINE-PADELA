import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Send,
  Sparkles,
  Zap,
  Activity,
  HeartPulse,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
} from '../types';
import {
  baixarRelatorioPDF,
  gerarTextoWhatsAppEvolucao,
  abrirWhatsAppComTexto,
} from '../services/pdfGenerator';

interface EvolucaoModalProps {
  isOpen?: boolean;
  paciente: Paciente;
  configClinica: ConfiguracaoClinica;
  evolucaoExistente?: EvolucaoClinica;
  procedimentoInicial?: string;
  procedimentoSugerido?: string;
  onClose: () => void;
  onSalvarEvolucao: (evolucao: EvolucaoClinica) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const REGIOES_ANATOMICAS = [
  'Cervical',
  'Trapézio Superior',
  'Escápulas / Romboides',
  'Lombar / Fáscia Toracolombar',
  'Glúteos / Piriforme',
  'Isquiotibiais / Posterior de Coxa',
  'Quadríceps / Trato Iliotibial',
  'Panturrilhas / Gastrocnêmio',
  'Pés / Fáscia Plantar',
  'Membros Superiores / Ombros',
  'Abdômen / Linfonodos',
  'Crânio / Face / ATM',
];

const TEMPLATES_EVOLUCAO = [
  {
    nome: 'Liberação Miofascial & Dor Lombar/Cervical',
    queixa: 'Dor miofascial localizada com presença de bandas tensas e redução de amplitude de movimento.',
    manobras: 'Desativação de pontos-gatilho (trigger points) com compressão isquêmica, deslizamento profundo com óleo vegetal e trações articulares leves.',
    reacao: 'Hiperemia reativa moderada esperada, relaxamento imediato da fáscia e ganho expressivo de mobilidade.',
    orientacoes: '1. Aplicação de compressa morna por 20 minutos antes de dormir.\n2. Ingestão hídrica abundante (mínimo 2.5L de água).\n3. Pausas ativas a cada 1 hora de trabalho sentado.',
  },
  {
    nome: 'Drenagem Linfática Manual (Edema/Pós-Op)',
    queixa: 'Sensação de peso, retenção hídrica em membros e desconforto circulatório.',
    manobras: 'Drenagem manual método Vodder: evacuação ganglionar supraclavicular, axilar e inguinal, manobras de bombeamento e bracelete suave.',
    reacao: 'Aumento expressivo do fluxo linfático, alívio da pressão tecidual e redução de medidas perimétricas.',
    orientacoes: '1. Manter pernas elevadas por 20 minutos à noite com apoio de travesseiro.\n2. Evitar alimentos ultraprocessados ricos em sódio.\n3. Caminhada leve de 15 minutos.',
  },
  {
    nome: 'Massagem Relaxante & Aromaterapia',
    queixa: 'Sobrecarga de estresse, tensão difusa nos ombros e qualidade de sono prejudicada.',
    manobras: 'Effleurage contínuo, amassamento suave e fricções palmares com blend de óleos essenciais de lavanda francesa e bergamota.',
    reacao: 'Redução significativa da frequência respiratória, relaxamento neuromusculoesquelético profundo e bem-estar geral.',
    orientacoes: '1. Banho morno relaxante e evitar telas 30 minutos antes de deitar.\n2. Chá de camomila ou melissa.\n3. Prática de respiração diafragmática 4-7-8.',
  },
  {
    nome: 'Ventosaterapia & Recovery Esportivo',
    queixa: 'Fadiga muscular aguda pós-treino intenso e sensação de queimação muscular.',
    manobras: 'Ventosaterapia dinâmica deslizante associada a pontos estáticos em paravertebrais e membros inferiores.',
    reacao: 'Marcas circulares transitórias de estase sanguínea (róseas a arroxeadas) e sensação imediata de descompressão muscular.',
    orientacoes: '1. Não tomar friagem ou vento gelado nas costas nas próximas 12 horas.\n2. Manter repouso ativo e boa suplementação mineral.\n3. Hidratação reforçada.',
  },
];

export const EvolucaoModal: React.FC<EvolucaoModalProps> = ({
  paciente,
  configClinica,
  evolucaoExistente,
  procedimentoInicial,
  procedimentoSugerido,
  onClose,
  onSalvarEvolucao,
  onShowToast,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const [dataSessao, setDataSessao] = useState(evolucaoExistente?.dataSessao || hoje);
  const [procedimentoRealizado, setProcedimentoRealizado] = useState(
    evolucaoExistente?.procedimentoRealizado ||
      procedimentoSugerido ||
      procedimentoInicial ||
      'Massagem Terapêutica & Liberação Miofascial'
  );
  const [terapeutaResponsavel, setTerapeutaResponsavel] = useState(
    evolucaoExistente?.terapeutaResponsavel || configClinica.nomeTerapeuta
  );

  // Escala EVA
  const [evaInicial, setEvaInicial] = useState<number>(evolucaoExistente?.evaInicial ?? 7);
  const [evaFinal, setEvaFinal] = useState<number>(evolucaoExistente?.evaFinal ?? 2);

  // Regiões
  const [regioesTrabalhadas, setRegioesTrabalhadas] = useState<string[]>(
    evolucaoExistente?.regioesTrabalhadas || ['Cervical', 'Trapézio Superior']
  );

  // Descrições
  const [queixaPrincipal, setQueixaPrincipal] = useState(
    evolucaoExistente?.queixaPrincipal || paciente.queixaInicial || ''
  );
  const [manobrasAplicadas, setManobrasAplicadas] = useState(
    evolucaoExistente?.manobrasAplicadas || 'Deslizamento profundo, desativação de trigger points e manobras de liberação miofascial.'
  );
  const [reacaoTecidual, setReacaoTecidual] = useState(
    evolucaoExistente?.reacaoTecidual || 'Hiperemia transitória leve a moderada, redução expressiva do tônus de bandas tensas.'
  );
  const [orientacoesCasa, setOrientacoesCasa] = useState(
    evolucaoExistente?.orientacoesCasa || '1. Manter hidratação adequada (2.5L de água).\n2. Compressa morna na região de maior tensão.\n3. Alongamentos suaves.'
  );
  const [observacoesGerais, setObservacoesGerais] = useState(evolucaoExistente?.observacoesGerais || '');
  const [proximaSessaoRecomendada, setProximaSessaoRecomendada] = useState(
    evolucaoExistente?.proximaSessaoRecomendada || ''
  );

  const toggleRegiao = (reg: string) => {
    setRegioesTrabalhadas((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const aplicarTemplate = (tpl: typeof TEMPLATES_EVOLUCAO[0]) => {
    setQueixaPrincipal(tpl.queixa);
    setManobrasAplicadas(tpl.manobras);
    setReacaoTecidual(tpl.reacao);
    setOrientacoesCasa(tpl.orientacoes);
    onShowToast('Modelo Aplicado', tpl.nome, 'info');
  };

  const construirObjetoEvolucao = (): EvolucaoClinica => {
    return {
      id: evolucaoExistente?.id || `evo-${Date.now()}`,
      pacienteId: paciente.id,
      dataSessao,
      procedimentoRealizado,
      terapeutaResponsavel,
      evaInicial,
      evaFinal,
      regioesTrabalhadas,
      queixaPrincipal,
      manobrasAplicadas,
      reacaoTecidual,
      orientacoesCasa,
      observacoesGerais,
      proximaSessaoRecomendada: proximaSessaoRecomendada || undefined,
      criadoEm: evolucaoExistente?.criadoEm || new Date().toISOString(),
    };
  };

  const handleSalvar = () => {
    const evo = construirObjetoEvolucao();
    onSalvarEvolucao(evo);
    onShowToast('Evolução Salva com Sucesso!', 'O prontuário do paciente foi atualizado.', 'success');
    onClose();
  };

  const handleBaixarPDF = () => {
    const evo = construirObjetoEvolucao();
    baixarRelatorioPDF(evo, paciente, configClinica);
    onShowToast('PDF Gerado!', 'Relatório clínico com logo e marca d\'água baixado.', 'success');
  };

  const handleEnviarWhatsApp = () => {
    const evo = construirObjetoEvolucao();
    const msg = gerarTextoWhatsAppEvolucao(evo, paciente, configClinica);
    abrirWhatsAppComTexto(paciente.whatsapp, msg);
    onShowToast('WhatsApp Aberto', 'Mensagem formatada pronta para envio.', 'info');
  };

  // Cálculo de melhora
  const melhoraPercentual = evaInicial > 0
    ? Math.round(((evaInicial - evaFinal) / evaInicial) * 100)
    : 0;

  return (
    <div
      id="modal-evolucao-clinica"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden my-3 sm:my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider">Relatório & Evolução Clínica</h3>
                <span className="text-[9px] font-bold uppercase bg-emerald-500 text-emerald-950 px-1.5 py-0.2 rounded font-mono">
                  Prontuário
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Paciente: <strong>{paciente.nome}</strong> • {paciente.whatsapp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Fast Template Buttons */}
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Modelos Clínicos Rápidos
              </span>
              <span className="text-[10px] text-slate-400">Preenchimento com 1 clique</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES_EVOLUCAO.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => aplicarTemplate(tpl)}
                  className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded shadow-2xs transition-colors"
                >
                  ⚡ {tpl.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Dados Gerais da Sessão */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Data da Sessão</label>
              <input
                type="date"
                value={dataSessao}
                onChange={(e) => setDataSessao(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Procedimento Realizado</label>
              <input
                type="text"
                value={procedimentoRealizado}
                onChange={(e) => setProcedimentoRealizado(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Escala Visual Analógica de Dor (EVA) - Interativo */}
          <div className="bg-slate-50 p-3 rounded-md border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Escala Visual Analógica de Dor (EVA 0 a 10)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono border border-emerald-300">
                {melhoraPercentual >= 0 ? `Alívio: -${melhoraPercentual}%` : 'Sem alteração'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Dor Antes */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-md p-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-900 text-[11px]">Dor Inicial (Chegada)</span>
                  <span className="font-bold font-mono text-xs text-rose-700">{evaInicial} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaInicial}
                  onChange={(e) => setEvaInicial(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-1"
                />
                <div className="flex justify-between text-[9px] text-rose-700/70 font-medium">
                  <span>0 Sem Dor</span>
                  <span>5 Moderada</span>
                  <span>10 Severa</span>
                </div>
              </div>

              {/* Dor Depois */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-900 text-[11px]">Dor Final (Pós-Sessão)</span>
                  <span className="font-bold font-mono text-xs text-emerald-700">{evaFinal} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaFinal}
                  onChange={(e) => setEvaFinal(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1"
                />
                <div className="flex justify-between text-[9px] text-emerald-700/70 font-medium">
                  <span>0 Alívio Total</span>
                  <span>5 Moderada</span>
                  <span>10 Sem Alívio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regiões Anatômicas Tratadas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-emerald-600" />
              Regiões Anatômicas Trabalhadas
            </label>
            <div className="flex flex-wrap gap-1">
              {REGIOES_ANATOMICAS.map((reg) => {
                const isSelected = regioesTrabalhadas.includes(reg);
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => toggleRegiao(reg)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {reg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos Descritivos Clínicos */}
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                1. Queixa Principal & Quadro Clínico Relatado
              </label>
              <textarea
                rows={2}
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                placeholder="Descreva o motivo da procura, localização da dor, fatores de piora/melhora..."
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                2. Manobras, Técnicas e Condutas Aplicadas
              </label>
              <textarea
                rows={2}
                value={manobrasAplicadas}
                onChange={(e) => setManobrasAplicadas(e.target.value)}
                placeholder="Ex: Compressão isquêmica, deslizamento profundo, ventosaterapia deslizante, drenagem..."
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                3. Resposta Tecidual, Mobilidade e Observações
              </label>
              <textarea
                rows={2}
                value={reacaoTecidual}
                onChange={(e) => setReacaoTecidual(e.target.value)}
                placeholder="Ex: Hiperemia esperada, desativação de banda tensa, ganho de amplitude articular..."
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-emerald-50/50 p-2.5 rounded-md border border-emerald-200">
              <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                4. Orientações de Autocuidado Domiciliar (Enviado no WhatsApp/PDF)
              </label>
              <textarea
                rows={2}
                value={orientacoesCasa}
                onChange={(e) => setOrientacoesCasa(e.target.value)}
                placeholder="Orientações de compressas, hidratação, postura, alongamentos e pausas..."
                className="w-full px-2.5 py-1.5 rounded-md border border-emerald-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Data Sugerida para Próxima Sessão (Retorno)
              </label>
              <input
                type="date"
                value={proximaSessaoRecomendada}
                onChange={(e) => setProximaSessaoRecomendada(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Salvar */}
              <button
                id="btn-salvar-evolucao"
                onClick={handleSalvar}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Salvar Prontuário</span>
              </button>

              {/* Baixar PDF */}
              <button
                id="btn-baixar-pdf-evolucao"
                onClick={handleBaixarPDF}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Exportar PDF oficial timbrado com marca d'água"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar PDF (Marca d'Água)</span>
              </button>

              {/* Enviar WhatsApp */}
              <button
                id="btn-enviar-whatsapp-evolucao"
                onClick={handleEnviarWhatsApp}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Abrir WhatsApp com o resumo da evolução e orientações"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              O PDF gerado contém o cabeçalho timbrado da clínica, dados do terapeuta ({configClinica.registroProfissional}), logo e marca d'água de proteção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
