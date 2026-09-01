import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Send,
  Sparkles,
  DollarSign,
  Activity,
  HeartPulse,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
  Procedimento,
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
  procedimentos?: Procedimento[];
  evolucaoExistente?: EvolucaoClinica;
  procedimentoInicial?: string;
  procedimentoSugerido?: string;
  onClose: () => void;
  onSalvarEvolucao: (evolucao: EvolucaoClinica) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_REGIOES = [
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
    queixa: 'Dor miofascial localizada com presença de bandas tensas, pontos-gatilho ativos e redução da amplitude de movimento.',
    manobras: 'Desativação de pontos-gatilho (trigger points) com compressão isquêmica, deslizamento profundo com óleo vegetal e trações articulares suaves.',
    reacao: 'Hiperemia reativa moderada esperada, relaxamento imediato da fáscia muscular e ganho expressivo de mobilidade.',
    orientacoes: '1. Aplicação de compressa morna por 20 minutos antes de dormir.\n2. Ingestão hídrica abundante (mínimo 2.5L de água).\n3. Pausas ativas a cada 1 hora de trabalho sentado.',
  },
  {
    nome: 'Drenagem Linfática Manual (Edema/Pós-Op)',
    queixa: 'Sensação de peso, retenção hídrica em membros inferiores e desconforto circulatório.',
    manobras: 'Drenagem manual método Vodder: evacuação ganglionar supraclavicular, axilar e inguinal, manobras de bombeamento e bracelete suave.',
    reacao: 'Aumento expressivo do fluxo linfático, alívio da pressão tecidual e redução visual de edema.',
    orientacoes: '1. Manter pernas elevadas por 20 minutos à noite com apoio de travesseiro.\n2. Evitar alimentos ultraprocessados ricos em sódio.\n3. Caminhada leve de 15 minutos.',
  },
  {
    nome: 'Massagem Relaxante & Aromaterapia',
    queixa: 'Sobrecarga de estresse, tensão difusa nos ombros e qualidade de sono prejudicada.',
    manobras: 'Effleurage contínuo, amassamento suave e fricções palmares com blend de óleos essenciais de lavanda francesa e bergamota.',
    reacao: 'Redução significativa da frequência respiratória, relaxamento neuromusculoesquelético profundo e sensação de bem-estar.',
    orientacoes: '1. Banho morno relaxante e evitar telas 30 minutos antes de deitar.\n2. Chá de camomila ou melissa.\n3. Prática de respiração diafragmática 4-7-8.',
  },
  {
    nome: 'Ventosaterapia & Recovery Esportivo',
    queixa: 'Fadiga muscular aguda pós-treino intenso e sensação de queimação muscular.',
    manobras: 'Ventosaterapia dinâmica deslizante associada a pontos estáticos em paravertebrais e membros inferiores.',
    reacao: 'Marcas circulares transitórias de estase sanguínea (róseas a arroxeadas) e sensação imediata de descompressão muscular.',
    orientacoes: '1. Não tomar friagem ou vento gelado nas costas nas próximas 12 horas.\n2. Manter repouso ativo e hidratação reforçada.',
  },
];

export const EvolucaoModal: React.FC<EvolucaoModalProps> = ({
  paciente,
  configClinica,
  procedimentos = [],
  evolucaoExistente,
  procedimentoInicial,
  procedimentoSugerido,
  onClose,
  onSalvarEvolucao,
  onShowToast,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const defaultProcNome =
    evolucaoExistente?.procedimentoRealizado ||
    procedimentoSugerido ||
    procedimentoInicial ||
    (procedimentos.length > 0 ? procedimentos[0].nome : 'Massagem Terapêutica & Liberação Miofascial');

  const defaultProcObj = procedimentos.find((p) => p.nome === defaultProcNome);

  const [dataSessao, setDataSessao] = useState(evolucaoExistente?.dataSessao || hoje);
  const [procedimentoRealizado, setProcedimentoRealizado] = useState(defaultProcNome);
  const [terapeutaResponsavel, setTerapeutaResponsavel] = useState(
    evolucaoExistente?.terapeutaResponsavel || configClinica.nomeTerapeuta
  );

  // Informações Financeiras da Sessão
  const [valorPago, setValorPago] = useState<number>(
    evolucaoExistente?.valorPago ?? (defaultProcObj ? defaultProcObj.precoTotal : 160)
  );
  const [formaPagamento, setFormaPagamento] = useState<string>(
    evolucaoExistente?.formaPagamento || 'pix_infinitepay'
  );
  const [lancarFinanceiro, setLancarFinanceiro] = useState<boolean>(
    evolucaoExistente?.lancarFinanceiro ?? true
  );

  // Escala EVA de Dor
  const [evaInicial, setEvaInicial] = useState<number>(evolucaoExistente?.evaInicial ?? 7);
  const [evaFinal, setEvaFinal] = useState<number>(evolucaoExistente?.evaFinal ?? 2);

  // Regiões Anatômicas (com persistência local de novas regiões customizadas)
  const [listaRegioes, setListaRegioes] = useState<string[]>(() => {
    try {
      const salvas = localStorage.getItem('masso_regioes_anatomicas');
      if (salvas) {
        const parsed = JSON.parse(salvas);
        return Array.from(new Set([...DEFAULT_REGIOES, ...parsed]));
      }
    } catch {}
    return DEFAULT_REGIOES;
  });

  const [regioesTrabalhadas, setRegioesTrabalhadas] = useState<string[]>(
    evolucaoExistente?.regioesTrabalhadas || ['Cervical', 'Trapézio Superior']
  );
  const [novaRegiaoInput, setNovaRegiaoInput] = useState('');
  const [mostrarInputOutros, setMostrarInputOutros] = useState(false);

  const handleAdicionarOutraRegiao = () => {
    const limpo = novaRegiaoInput.trim();
    if (!limpo) return;

    if (!listaRegioes.includes(limpo)) {
      const novaLista = [...listaRegioes, limpo];
      setListaRegioes(novaLista);
      try {
        localStorage.setItem('masso_regioes_anatomicas', JSON.stringify(novaLista));
      } catch {}
    }

    if (!regioesTrabalhadas.includes(limpo)) {
      setRegioesTrabalhadas((prev) => [...prev, limpo]);
    }

    setNovaRegiaoInput('');
    setMostrarInputOutros(false);
    onShowToast('Região Adicionada', `"${limpo}" foi salva nas opções rápidas.`, 'success');
  };

  // Acompanhamento Corporal / Antropometria da Sessão (Drenagem & Perda de Líquidos)
  const [pesoKg, setPesoKg] = useState<string>(
    evolucaoExistente?.pesoKg !== undefined
      ? evolucaoExistente.pesoKg.toString()
      : (paciente.peso ? paciente.peso.replace(/[^\d.,]/g, '').replace(',', '.') : '')
  );
  const [pesoFinalSessaoKg, setPesoFinalSessaoKg] = useState<string>(
    evolucaoExistente?.pesoFinalSessaoKg !== undefined
      ? evolucaoExistente.pesoFinalSessaoKg.toString()
      : ''
  );
  const [circunferenciaCm, setCircunferenciaCm] = useState<string>(
    evolucaoExistente?.circunferenciaCm || ''
  );

  // Relatório de Anamnese & Evolução Clínica
  const [queixaPrincipal, setQueixaPrincipal] = useState(
    evolucaoExistente?.queixaPrincipal || paciente.queixaInicial || ''
  );
  const [manobrasAplicadas, setManobrasAplicadas] = useState(
    evolucaoExistente?.manobrasAplicadas || 'Deslizamento profundo, desativação de trigger points e manobras de liberação miofascial.'
  );
  const [reacaoTecidual, setReacaoTecidual] = useState(
    evolucaoExistente?.reacaoTecidual || 'Hiperemia transitória leve a moderada, relaxamento imediato da fáscia muscular.'
  );
  const [orientacoesCasa, setOrientacoesCasa] = useState(
    evolucaoExistente?.orientacoesCasa || '1. Manter hidratação adequada (2.5L de água).\n2. Compressa morna na região de maior tensão.\n3. Alongamentos suaves.'
  );
  const [observacoesGerais, setObservacoesGerais] = useState(evolucaoExistente?.observacoesGerais || '');
  const [proximaSessaoRecomendada, setProximaSessaoRecomendada] = useState(
    evolucaoExistente?.proximaSessaoRecomendada || ''
  );

  const handleSelectProcedimento = (nome: string) => {
    setProcedimentoRealizado(nome);
    const proc = procedimentos.find((p) => p.nome === nome);
    if (proc && (!evolucaoExistente || valorPago === 0)) {
      setValorPago(proc.precoTotal);
    }
  };

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
    onShowToast('Modelo Clínico Aplicado', tpl.nome, 'info');
  };

  const construirObjetoEvolucao = (): EvolucaoClinica => {
    return {
      id: evolucaoExistente?.id || `evo-${Date.now()}`,
      pacienteId: paciente.id,
      agendamentoId: evolucaoExistente?.agendamentoId,
      dataSessao,
      horario: evolucaoExistente?.horario,
      statusRelatorio: 'concluido', // Salvar conclui o relatório da sessão
      procedimentoRealizado,
      terapeutaResponsavel,
      evaInicial,
      evaFinal,
      pesoKg: pesoKg.trim() ? pesoKg.trim() : undefined,
      pesoFinalSessaoKg: pesoFinalSessaoKg.trim() ? pesoFinalSessaoKg.trim() : undefined,
      circunferenciaCm: circunferenciaCm.trim() ? circunferenciaCm.trim() : undefined,
      regioesTrabalhadas,
      queixaPrincipal,
      manobrasAplicadas,
      reacaoTecidual,
      orientacoesCasa,
      observacoesGerais,
      proximaSessaoRecomendada: proximaSessaoRecomendada || undefined,
      valorPago: Number(valorPago) || 0,
      formaPagamento,
      lancarFinanceiro,
      criadoEm: evolucaoExistente?.criadoEm || new Date().toISOString(),
    };
  };

  const handleSalvar = () => {
    const evo = construirObjetoEvolucao();
    onSalvarEvolucao(evo);
    onClose();
  };

  const handleBaixarPDF = () => {
    const evo = construirObjetoEvolucao();
    baixarRelatorioPDF(evo, paciente, configClinica);
    onShowToast('Relatório PDF Gerado!', `Emitido timbrado (${configClinica.cidadeUf || 'Maricá - RJ'}) com marca d'água de proteção.`, 'success');
  };

  const handleEnviarWhatsApp = () => {
    const evo = construirObjetoEvolucao();
    const msg = gerarTextoWhatsAppEvolucao(evo, paciente, configClinica);
    abrirWhatsAppComTexto(paciente.whatsapp, msg);
    onShowToast('WhatsApp Aberto', 'Mensagem formatada com orientações da sessão.', 'info');
  };

  const melhoraPercentual =
    evaInicial > 0 ? Math.round(((evaInicial - evaFinal) / evaInicial) * 100) : 0;

  return (
    <div
      id="modal-adicionar-sessao"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-3 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {evolucaoExistente ? 'Editar Sessão & Anamnese' : 'Adicionar Sessão & Relatório de Anamnese'}
                </h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded font-mono">
                  Prontuário
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paciente: <strong className="text-white">{paciente.nome}</strong> • {paciente.whatsapp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Lembrete de Sessão Agendada Pendente de Relatório */}
          {evolucaoExistente?.statusRelatorio === 'pendente' && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
              <div className="p-1 bg-amber-100 text-amber-700 rounded-md shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  Concluindo Relatório da Sessão Agendada
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Esta sessão foi registrada pelo agendamento. Preencha as manobras realizadas, avaliação EVA de dor e condutas aplicadas para finalizar o relatório clínico oficial.
                </p>
              </div>
            </div>
          )}

          {/* Fast Template Bar */}
          <div className="space-y-1.5 bg-emerald-50/50 p-2.5 sm:p-3 rounded-lg border border-emerald-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Modelos Clínicos Prontos (Preenchimento com 1 Clique)
              </span>
              <span className="text-[10px] text-emerald-700">Agilize seu relatório</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TEMPLATES_EVOLUCAO.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => aplicarTemplate(tpl)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md shadow-2xs transition-colors"
                >
                  ⚡ {tpl.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Seção 1: Procedimento, Data e Dados Financeiros */}
          <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              1. Procedimento Realizado & Registro Financeiro da Sessão
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Procedimento */}
              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Procedimento / Terapia
                </label>
                {procedimentos.length > 0 ? (
                  <select
                    value={procedimentoRealizado}
                    onChange={(e) => handleSelectProcedimento(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {procedimentos.map((proc) => (
                      <option key={proc.id} value={proc.nome}>
                        {proc.nome} — R$ {proc.precoTotal.toFixed(2)} ({proc.duracaoMinutos} min)
                      </option>
                    ))}
                    <option value="Outro Procedimento">Outro Procedimento Personalizado...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={procedimentoRealizado}
                    onChange={(e) => setProcedimentoRealizado(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Data da Sessão */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Data da Sessão</label>
                <input
                  type="date"
                  value={dataSessao}
                  onChange={(e) => setDataSessao(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Terapeuta */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Terapeuta</label>
                <input
                  type="text"
                  value={terapeutaResponsavel}
                  onChange={(e) => setTerapeutaResponsavel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Valor Pago da Sessão */}
              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Valor Pago nesta Sessão (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorPago}
                  onChange={(e) => setValorPago(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-900"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="pix_infinitepay">⚡ Pix Instantâneo InfinitePay</option>
                  <option value="cartao_credito">💳 Cartão de Crédito (InfinitePay / Link)</option>
                  <option value="dinheiro">💵 Dinheiro Presencial (Espécie)</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="pacote">📦 Pacote de Sessões (Já Pago)</option>
                  <option value="transferencia">🏦 Transferência Bancária</option>
                </select>
              </div>

              {/* Lançar no Financeiro Checkbox */}
              <div className="sm:col-span-4 flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer select-none bg-white p-2 rounded border border-slate-200 w-full hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={lancarFinanceiro}
                    onChange={(e) => setLancarFinanceiro(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Lançar no Livro Caixa Financeiro</span>
                </label>
              </div>
            </div>
          </div>

          {/* Seção 2: Escala EVA de Dor */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Avaliação de Dor (Escala EVA 0 a 10)
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-mono border border-emerald-300">
                {melhoraPercentual >= 0 ? `Alívio: -${melhoraPercentual}%` : 'Sem alteração'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dor Antes */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-md p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-900">Dor Inicial (Chegada)</span>
                  <span className="font-bold font-mono text-sm text-rose-700">{evaInicial} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaInicial}
                  onChange={(e) => setEvaInicial(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-rose-700/80 font-medium">
                  <span>0 Sem Dor</span>
                  <span>5 Moderada</span>
                  <span>10 Severa / Incapacitante</span>
                </div>
              </div>

              {/* Dor Depois */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-md p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-900">Dor Final (Pós-Sessão)</span>
                  <span className="font-bold font-mono text-sm text-emerald-700">{evaFinal} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaFinal}
                  onChange={(e) => setEvaFinal(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-emerald-700/80 font-medium">
                  <span>0 Alívio Total</span>
                  <span>5 Moderada</span>
                  <span>10 Sem Alívio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Antropométrica da Sessão: Peso / Massa Corporal & Perda de Líquidos (Drenagem) */}
          <div className="bg-sky-50/70 p-3.5 rounded-lg border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-sky-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Acompanhamento Corporal & Perda de Líquidos (Sessão / Drenagem)
                </h4>
              </div>
              {(() => {
                const pIni = parseFloat(pesoKg.replace(',', '.'));
                const pFim = parseFloat(pesoFinalSessaoKg.replace(',', '.'));
                if (!isNaN(pIni) && !isNaN(pFim) && pIni > 0 && pFim > 0) {
                  const dif = pIni - pFim;
                  const difGramas = Math.round(dif * 1000);
                  return (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono border ${
                      dif > 0
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {dif > 0 ? `💧 Perda Líquida: -${dif.toFixed(2)} kg (-${difGramas}g)` : `Variação: ${dif.toFixed(2)} kg`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  ⚖️ Peso Inicial da Sessão (kg)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 68.4"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Peso na chegada à clínica</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  💧 Peso Pós-Sessão / Drenagem (kg)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 67.9 (Opcional)"
                  value={pesoFinalSessaoKg}
                  onChange={(e) => setPesoFinalSessaoKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold text-sky-950"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Para tratamentos de retenção/edema</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  📏 Medidas / Circunferências (cm)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abdômen: 78cm, Coxa: 54cm"
                  value={circunferenciaCm}
                  onChange={(e) => setCircunferenciaCm(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Medidas corporais opcionais</span>
              </div>
            </div>
          </div>

          {/* Seção 4: Regiões Anatômicas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                4. Regiões Anatômicas Trabalhadas
              </label>
              <button
                type="button"
                onClick={() => setMostrarInputOutros(!mostrarInputOutros)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                + Outros (Adicionar nova região)
              </button>
            </div>

            {/* Input para adicionar nova região em Outros */}
            {mostrarInputOutros && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <input
                  type="text"
                  value={novaRegiaoInput}
                  onChange={(e) => setNovaRegiaoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdicionarOutraRegiao();
                    }
                  }}
                  placeholder="Nome da nova região anatômica (ex: Manguito Rotador, Tendão de Aquiles...)"
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAdicionarOutraRegiao}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  Salvar Região
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarInputOutros(false)}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {listaRegioes.map((reg) => {
                const isSelected = regioesTrabalhadas.includes(reg);
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => toggleRegiao(reg)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer ${
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

          {/* Seção 5: Relatório de Anamnese & Evolução da Sessão */}
          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              5. Relatório de Anamnese & Evolução da Sessão
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Queixa Principal & Anamnese da Sessão
              </label>
              <textarea
                rows={2}
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                placeholder="Descreva o motivo da procura, localização e tipo de dor, fatores de piora/melhora..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Manobras, Técnicas e Condutas Aplicadas
              </label>
              <textarea
                rows={2}
                value={manobrasAplicadas}
                onChange={(e) => setManobrasAplicadas(e.target.value)}
                placeholder="Ex: Desativação de trigger points, deslizamento miofascial profundo, ventosaterapia, drenagem..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Resposta Tecidual, Mobilidade e Avaliação Pós-Atendimento
              </label>
              <textarea
                rows={2}
                value={reacaoTecidual}
                onChange={(e) => setReacaoTecidual(e.target.value)}
                placeholder="Ex: Hiperemia transitória reativa esperada, relaxamento da fáscia, ganho de mobilidade articular..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
              <label className="text-xs font-bold text-emerald-900 block mb-1">
                Orientações de Autocuidado Domiciliar (Enviado ao Paciente no WhatsApp e PDF)
              </label>
              <textarea
                rows={2}
                value={orientacoesCasa}
                onChange={(e) => setOrientacoesCasa(e.target.value)}
                placeholder="Orientações sobre hidratação, compressas, postura, alongamentos e pausas..."
                className="w-full px-3 py-2 rounded-md border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Data Sugerida para Retorno / Próxima Sessão
                </label>
                <input
                  type="date"
                  value={proximaSessaoRecomendada}
                  onChange={(e) => setProximaSessaoRecomendada(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações Internas (Opcional)
                </label>
                <input
                  type="text"
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  placeholder="Anotações internas do terapeuta..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Salvar */}
            <button
              id="btn-salvar-sessao"
              onClick={handleSalvar}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Sessão & Prontuário</span>
            </button>

            {/* Gerar Relatório de Anamnese & Evolução PDF */}
            <button
              id="btn-gerar-relatorio-pdf"
              onClick={handleBaixarPDF}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Gera o Relatório Clínico Oficial timbrado com os dados da clínica (Maricá - RJ) sem expor valores financeiros"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Gerar Relatório Anamnese (PDF)</span>
            </button>

            {/* Enviar WhatsApp */}
            <button
              id="btn-enviar-whats-sessao"
              onClick={handleEnviarWhatsApp}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Abre o WhatsApp com o resumo clínico e orientações para o paciente"
            >
              <Send className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            * O Relatório de Anamnese em PDF é emitido com cabeçalho timbrado oficial da clínica ({configClinica.nomeClinica || 'Espaço Terapêutico'} • {configClinica.cidadeUf || 'Maricá - RJ'}) e <strong>não contém dados de valores financeiros</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
