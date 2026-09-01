import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Plus,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Trash2,
  PieChart,
  ShoppingBag,
  CreditCard,
  Building2,
  Layers,
  Package,
  Check,
  Clock,
  User,
  AlertCircle,
  FolderPlus,
  ChevronDown,
  Activity,
  History,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  ConfiguracaoInter,
  TransacaoFinanceira,
  TipoTransacao,
  Procedimento,
  Paciente,
  PacoteSessoes,
  ItemSessaoRealizada,
} from '../types';

interface FinanceiroViewProps {
  transacoes: TransacaoFinanceira[];
  procedimentos: Procedimento[];
  pacientes: Paciente[];
  pacotesSessoes: PacoteSessoes[];
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  onNovaTransacao: (transacao: TransacaoFinanceira) => void;
  onExcluirTransacao: (transacaoId: string) => void;
  onNovoPacote: (pacote: PacoteSessoes) => void;
  onAtualizarPacote: (pacote: PacoteSessoes) => void;
  onExcluirPacote: (pacoteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export type PeriodoFiltro = 'esta_semana' | 'semana_passada' | 'este_mes' | 'mes_passado' | 'todos' | 'personalizado';
export type TipoTransacaoFiltro = 'todos' | 'receita' | 'despesa';

const CATEGORIAS_DESPESA_PADRAO = [
  'Insumos & Descartáveis',
  'Óleos & Cosméticos',
  'Aluguel & Espaço',
  'Lavanderia & Higienização',
  'Marketing & Divulgação',
  'Equipamentos & Manutenção',
  'Custos Fixos & Internet',
  'Impostos & Taxas',
  'Outros Custos',
];

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  transacoes,
  procedimentos,
  pacientes,
  pacotesSessoes = [],
  configClinica,
  configInter,
  onNovaTransacao,
  onExcluirTransacao,
  onNovoPacote,
  onAtualizarPacote,
  onExcluirPacote,
  onShowToast,
}) => {
  // Navigation sub-tab inside Finance
  const [subTab, setSubTab] = useState<'movimentacoes' | 'pacotes'>('movimentacoes');

  // Period and Type Filters via Dropdown
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('este_mes');
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoTransacaoFiltro>('todos');

  // Modals state
  const [modalNovo, setModalNovo] = useState(false);
  const [modalNovoPacote, setModalNovoPacote] = useState(false);
  const [modalRegistrarSessao, setModalRegistrarSessao] = useState<PacoteSessoes | null>(null);

  // Form states - Transação
  const [formTipo, setFormTipo] = useState<'receita' | 'despesa'>('receita');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formFormaPagto, setFormFormaPagto] = useState<TransacaoFinanceira['formaPagamento']>('dinheiro');
  
  // Custom expense category & predefined
  const [formCategoriaDespesa, setFormCategoriaDespesa] = useState(CATEGORIAS_DESPESA_PADRAO[0]);
  const [isCriandoNovaCategoriaDespesa, setIsCriandoNovaCategoriaDespesa] = useState(false);
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('');
  const [listaCategoriasDespesa, setListaCategoriasDespesa] = useState<string[]>(CATEGORIAS_DESPESA_PADRAO);

  // Revenue by procedure / patient
  const [formProcedimentoId, setFormProcedimentoId] = useState<string>(procedimentos[0]?.id || '');
  const [formPacienteId, setFormPacienteId] = useState<string>('');

  // Form states - Novo Pacote de Sessões
  const [pacotePacienteId, setPacotePacienteId] = useState<string>(pacientes[0]?.id || '');
  const [pacoteProcedimentoId, setPacoteProcedimentoId] = useState<string>(procedimentos[0]?.id || '');
  const [pacoteTotalSessoes, setPacoteTotalSessoes] = useState<number>(8); // default 8 sessões
  const [pacoteValorTotal, setPacoteValorTotal] = useState<string>('');
  const [pacoteValorPago, setPacoteValorPago] = useState<string>('');
  const [pacoteFormaPagamento, setPacoteFormaPagamento] = useState<TransacaoFinanceira['formaPagamento']>('dinheiro');
  const [pacoteObservacoes, setPacoteObservacoes] = useState('');
  const [pacoteGerarLancamentoFinanceiro, setPacoteGerarLancamentoFinanceiro] = useState(true);

  // Form states - Registrar Sessão Realizada
  const [sessaoData, setSessaoData] = useState(new Date().toISOString().split('T')[0]);
  const [sessaoHorario, setSessaoHorario] = useState('14:00');
  const [sessaoObservacoes, setSessaoObservacoes] = useState('');
  const [sessaoTerapeuta, setSessaoTerapeuta] = useState(configClinica.nomeTerapeuta || 'Terapeuta');

  // Helpers for date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

    // Esta semana
    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() + diffToMonday);
    startThisWeek.setHours(0, 0, 0, 0);

    const endThisWeek = new Date(startThisWeek);
    endThisWeek.setDate(startThisWeek.getDate() + 6);
    endThisWeek.setHours(23, 59, 59, 999);

    // Semana passada
    const startLastWeek = new Date(startThisWeek);
    startLastWeek.setDate(startThisWeek.getDate() - 7);

    const endLastWeek = new Date(startThisWeek);
    endLastWeek.setDate(startThisWeek.getDate() - 1);

    // Este mês
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Mês passado
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const toStr = (d: Date) => d.toISOString().split('T')[0];

    return {
      estaSemana: { inicio: toStr(startThisWeek), fim: toStr(endThisWeek) },
      semanaPassada: { inicio: toStr(startLastWeek), fim: toStr(endLastWeek) },
      esteMes: { inicio: toStr(startThisMonth), fim: toStr(endThisMonth) },
      mesPassado: { inicio: toStr(startLastMonth), fim: toStr(endLastMonth) },
    };
  }, []);

  // Filter transactions
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      // Type filter
      if (tipoFiltro !== 'todos' && t.tipo !== tipoFiltro) return false;

      // Period filter
      if (periodo === 'esta_semana') {
        return t.data >= dateRanges.estaSemana.inicio && t.data <= dateRanges.estaSemana.fim;
      }
      if (periodo === 'semana_passada') {
        return t.data >= dateRanges.semanaPassada.inicio && t.data <= dateRanges.semanaPassada.fim;
      }
      if (periodo === 'este_mes') {
        return t.data >= dateRanges.esteMes.inicio && t.data <= dateRanges.esteMes.fim;
      }
      if (periodo === 'mes_passado') {
        return t.data >= dateRanges.mesPassado.inicio && t.data <= dateRanges.mesPassado.fim;
      }
      if (periodo === 'personalizado') {
        if (dataInicioCustom && t.data < dataInicioCustom) return false;
        if (dataFimCustom && t.data > dataFimCustom) return false;
        return true;
      }
      return true; // 'todos'
    });
  }, [transacoes, tipoFiltro, periodo, dateRanges, dataInicioCustom, dataFimCustom]);

  // Sort by date desc
  const sortedTransacoes = useMemo(() => {
    return [...transacoesFiltradas].sort((a, b) => b.data.localeCompare(a.data));
  }, [transacoesFiltradas]);

  // Financial Metrics
  const totalReceitas = useMemo(() => {
    return transacoesFiltradas
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesFiltradas]);

  const totalDespesas = useMemo(() => {
    return transacoesFiltradas
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesFiltradas]);

  const lucroLiquido = totalReceitas - totalDespesas;
  const margemLucro = totalReceitas > 0 ? Math.round((lucroLiquido / totalReceitas) * 100) : 0;

  const totalPixInter = useMemo(() => {
    return transacoesFiltradas
      .filter((t) => t.formaPagamento === 'pix_inter')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesFiltradas]);

  // Pacotes stats
  const pacotesAtivos = pacotesSessoes.filter((p) => p.status === 'ativo');
  const totalSessoesContratadas = pacotesSessoes.reduce((acc, p) => acc + p.totalSessoes, 0);
  const totalSessoesRealizadas = pacotesSessoes.reduce((acc, p) => acc + p.sessoesRealizadas, 0);
  const totalSessoesPendentes = totalSessoesContratadas - totalSessoesRealizadas;

  // Handle revenue procedure change
  const handleSelectProcedimentoReceita = (procId: string) => {
    setFormProcedimentoId(procId);
    const proc = procedimentos.find((p) => p.id === procId);
    if (proc) {
      setFormDescricao(`Atendimento Presencial: ${proc.nome}`);
      setFormValor(proc.precoTotal.toString());
    }
  };

  // Handle new transaction submit
  const handleSalvarTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValor);
    if (isNaN(val) || val <= 0 || !formDescricao.trim()) {
      onShowToast('Atenção', 'Informe uma descrição e valor válidos.', 'error');
      return;
    }

    let categoriaFinal = '';
    let categoriaNome = '';

    if (formTipo === 'receita') {
      const proc = procedimentos.find((p) => p.id === formProcedimentoId);
      categoriaFinal = formProcedimentoId ? `proc_${formProcedimentoId}` : 'receita_avulsa';
      categoriaNome = proc ? proc.nome : 'Procedimento / Serviço';
    } else {
      if (isCriandoNovaCategoriaDespesa && novaCategoriaInput.trim()) {
        categoriaFinal = novaCategoriaInput.trim();
        categoriaNome = novaCategoriaInput.trim();
        if (!listaCategoriasDespesa.includes(novaCategoriaInput.trim())) {
          setListaCategoriasDespesa((prev) => [...prev, novaCategoriaInput.trim()]);
        }
      } else {
        categoriaFinal = formCategoriaDespesa;
        categoriaNome = formCategoriaDespesa;
      }
    }

    const paciente = pacientes.find((p) => p.id === formPacienteId);

    const nova: TransacaoFinanceira = {
      id: `fin-${Date.now()}`,
      tipo: formTipo,
      categoria: categoriaFinal,
      categoriaNome: categoriaNome,
      descricao: formDescricao,
      valor: val,
      data: formData,
      formaPagamento: formFormaPagto,
      pacienteId: paciente?.id,
      pacienteNome: paciente?.nome,
      procedimentoId: formProcedimentoId || undefined,
      status: 'confirmado',
      comprovanteRef:
        formFormaPagto === 'pix_inter'
          ? `INTER-PIX-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined,
      criadoEm: new Date().toISOString(),
    };

    onNovaTransacao(nova);
    onShowToast(
      'Lançamento Registrado!',
      `${formTipo === 'receita' ? '+' : '-'} R$ ${val.toFixed(2)} (${categoriaNome})`,
      'success'
    );
    setModalNovo(false);
    setFormDescricao('');
    setFormValor('');
    setIsCriandoNovaCategoriaDespesa(false);
    setNovaCategoriaInput('');
  };

  // Handle creating new package
  const handleSalvarNovoPacote = (e: React.FormEvent) => {
    e.preventDefault();
    const paciente = pacientes.find((p) => p.id === pacotePacienteId);
    const proc = procedimentos.find((p) => p.id === pacoteProcedimentoId);

    if (!paciente) {
      onShowToast('Atenção', 'Selecione um paciente para o pacote.', 'error');
      return;
    }

    const valTotal = parseFloat(pacoteValorTotal) || (proc ? proc.precoTotal * pacoteTotalSessoes : 0);
    const valPago = parseFloat(pacoteValorPago) || valTotal;

    const novoPacote: PacoteSessoes = {
      id: `pacote-${Date.now()}`,
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
      pacienteWhatsapp: paciente.whatsapp,
      procedimentoId: proc?.id,
      procedimentoNome: proc?.nome || 'Tratamento Especial',
      totalSessoes: pacoteTotalSessoes,
      sessoesRealizadas: 0,
      valorTotal: valTotal,
      valorPago: valPago,
      statusPagamento: valPago >= valTotal ? 'pago_integral' : valPago > 0 ? 'parcial' : 'pendente',
      status: 'ativo',
      historicoRealizacoes: [],
      dataContratacao: new Date().toISOString().split('T')[0],
      observacoes: pacoteObservacoes,
      criadoEm: new Date().toISOString(),
    };

    onNovoPacote(novoPacote);

    // Lançamento automático no financeiro se solicitado
    if (pacoteGerarLancamentoFinanceiro && valPago > 0) {
      const tx: TransacaoFinanceira = {
        id: `fin-pacote-${Date.now()}`,
        tipo: 'receita',
        categoria: 'receita_pacote',
        categoriaNome: `Pacote ${pacoteTotalSessoes}x ${novoPacote.procedimentoNome}`,
        descricao: `Venda de Pacote ${pacoteTotalSessoes} Sessões - ${paciente.nome}`,
        valor: valPago,
        data: new Date().toISOString().split('T')[0],
        formaPagamento: pacoteFormaPagamento,
        pacienteId: paciente.id,
        pacienteNome: paciente.nome,
        pacoteId: novoPacote.id,
        status: 'confirmado',
        criadoEm: new Date().toISOString(),
      };
      onNovaTransacao(tx);
    }

    onShowToast('Pacote Cadastrado!', `${pacoteTotalSessoes} sessões para ${paciente.nome}`, 'success');
    setModalNovoPacote(false);
    setPacoteObservacoes('');
    setPacoteValorTotal('');
    setPacoteValorPago('');
  };

  // Handle registering completed session on a package
  const handleConfirmarSessaoRealizada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRegistrarSessao) return;

    if (modalRegistrarSessao.sessoesRealizadas >= modalRegistrarSessao.totalSessoes) {
      onShowToast('Pacote Concluído', 'Todas as sessões deste pacote já foram realizadas!', 'info');
      return;
    }

    const novaRealizacao: ItemSessaoRealizada = {
      id: `realizacao-${Date.now()}`,
      data: sessaoData,
      horario: sessaoHorario,
      observacoes: sessaoObservacoes,
      terapeuta: sessaoTerapeuta,
    };

    const novoTotalRealizadas = modalRegistrarSessao.sessoesRealizadas + 1;
    const isFinalizado = novoTotalRealizadas >= modalRegistrarSessao.totalSessoes;

    const pacoteAtualizado: PacoteSessoes = {
      ...modalRegistrarSessao,
      sessoesRealizadas: novoTotalRealizadas,
      status: isFinalizado ? 'concluido' : 'ativo',
      historicoRealizacoes: [novaRealizacao, ...(modalRegistrarSessao.historicoRealizacoes || [])],
    };

    onAtualizarPacote(pacoteAtualizado);
    onShowToast(
      'Sessão Registrada!',
      `Sessão ${novoTotalRealizadas} de ${modalRegistrarSessao.totalSessoes} realizada para ${modalRegistrarSessao.pacienteNome}.`,
      'success'
    );
    setModalRegistrarSessao(null);
    setSessaoObservacoes('');
  };

  return (
    <div id="view-financeiro-completo" className="space-y-4">
      {/* Top Header Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Gestão Financeira & Custos do Consultório
            </h2>
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              Pix Banco Inter Integrado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Receitas automáticas via Pix Inter, lançamentos presenciais, custos operacionais e controle de pacotes de sessões.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            id="btn-imprimir-relatorio"
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            title="Imprimir relatório financeiro do período selecionado"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Imprimir Relatório</span>
          </button>

          <button
            id="btn-abrir-novo-pacote"
            type="button"
            onClick={() => {
              if (procedimentos.length > 0) {
                const proc = procedimentos[0];
                const qtd = proc.tipo === 'pacote' && proc.quantidadeSessoes ? proc.quantidadeSessoes : 8;
                setPacoteTotalSessoes(qtd);
                const valor = proc.tipo === 'pacote' ? proc.precoTotal : proc.precoTotal * qtd;
                setPacoteValorTotal(valor.toString());
                setPacoteValorPago(valor.toString());
                setPacoteProcedimentoId(proc.id);
              }
              setModalNovoPacote(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Novo Pacote</span>
          </button>

          <button
            id="btn-novo-lancamento-financeiro"
            type="button"
            onClick={() => {
              if (procedimentos.length > 0) {
                handleSelectProcedimentoReceita(procedimentos[0].id);
              }
              setModalNovo(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Sub-nav Tabs (Movimentações Caixa vs Controle de Pacotes) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          id="tab-movimentacoes"
          type="button"
          onClick={() => setSubTab('movimentacoes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'movimentacoes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Livro Caixa & Movimentações</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${subTab === 'movimentacoes' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
            {sortedTransacoes.length}
          </span>
        </button>

        <button
          id="tab-pacotes"
          type="button"
          onClick={() => setSubTab('pacotes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'pacotes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Controle de Pacotes (Pagas vs Realizadas)</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${subTab === 'pacotes' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>
            {pacotesAtivos.length} ativos
          </span>
        </button>
      </div>

      {/* ======================= SUB-TAB 1: MOVIMENTAÇÕES CAIXA ======================= */}
      {subTab === 'movimentacoes' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS COM LISTA SUSPENSA (DROPDOWN) */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Dropdown de Período */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Período de Visualização:</span>
                </div>
                <div className="relative flex-1 sm:w-56">
                  <select
                    id="select-periodo-financeiro"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                  >
                    <option value="esta_semana">📅 Esta Semana</option>
                    <option value="semana_passada">📅 Semana Passada</option>
                    <option value="este_mes">🗓️ Este Mês</option>
                    <option value="mes_passado">🗓️ Mês Passado</option>
                    <option value="todos">🌐 Todo o Período</option>
                    <option value="personalizado">🔍 Período Personalizado...</option>
                  </select>
                </div>
              </div>

              {/* Dropdown de Tipo de Transação (Todos / Entradas / Custos) */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Tipo de Lançamento:</span>
                </div>
                <div className="relative flex-1 sm:w-48">
                  <select
                    id="select-tipo-transacao"
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value as TipoTransacaoFiltro)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                  >
                    <option value="todos">🔹 Todos os Lançamentos</option>
                    <option value="receita">🟢 Apenas Entradas (Receitas)</option>
                    <option value="despesa">🔴 Apenas Custos (Despesas)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inputs de Data quando selecionado Personalizado */}
            {periodo === 'personalizado' && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-600 font-medium">De:</label>
                  <input
                    type="date"
                    value={dataInicioCustom}
                    onChange={(e) => setDataInicioCustom(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-600 font-medium">Até:</label>
                  <input
                    type="date"
                    value={dataFimCustom}
                    onChange={(e) => setDataFimCustom(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                {(dataInicioCustom || dataFimCustom) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDataInicioCustom('');
                      setDataFimCustom('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Limpar datas
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CARDS DE RESUMO FINANCEIRO (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Faturamento Bruto */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Faturamento Bruto
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                R$ {totalReceitas.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">
                {transacoesFiltradas.filter((t) => t.tipo === 'receita').length} entrada(s) no período
              </p>
            </div>

            {/* Custos Totais */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Custos & Despesas
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-600">
                R$ {totalDespesas.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">
                {transacoesFiltradas.filter((t) => t.tipo === 'despesa').length} custo(s) e insumos
              </p>
            </div>

            {/* Lucro Líquido Real */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs space-y-1.5 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Lucro Líquido Real
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                R$ {lucroLiquido.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Margem Líquida: <strong>{margemLucro}%</strong>
              </p>
            </div>

            {/* Pix Banco Inter */}
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                  Recebido via Pix Inter
                </span>
                <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-mono">
                  Automático
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-950">
                R$ {totalPixInter.toFixed(2)}
              </div>
              <p className="text-[11px] text-amber-800 font-mono truncate">
                Chave: {configInter.chavePix || 'Não configurada'}
              </p>
            </div>
          </div>

          {/* TABELA DETALHADA DO LIVRO CAIXA */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Movimentações & Lançamentos ({sortedTransacoes.length})
                </h3>
                <p className="text-xs text-slate-500">Histórico de receitas e custos no período selecionado</p>
              </div>
            </div>

            {sortedTransacoes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Nenhum lançamento encontrado para o período e filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Forma Pagto</th>
                      <th className="py-3 px-4 text-right">Valor (R$)</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTransacoes.map((t) => {
                      const isReceita = t.tipo === 'receita';
                      const dataFormatada = new Date(t.data + 'T12:00:00Z').toLocaleDateString('pt-BR');

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap font-mono">
                            {dataFormatada}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {isReceita ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3" /> Receita
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <ArrowDownRight className="w-3 h-3" /> Custo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                              {t.categoriaNome || t.categoria}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-800 font-medium">
                            <div>{t.descricao}</div>
                            {t.pacienteNome && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3 text-slate-400" />
                                {t.pacienteNome}
                              </div>
                            )}
                            {t.comprovanteRef && (
                              <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">
                                {t.comprovanteRef}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {(t.formaPagamento === 'pix_infinitepay' || t.formaPagamento === 'pix_inter') && '⚡ Pix InfinitePay'}
                              {t.formaPagamento === 'cartao_credito' && '💳 Cartão Crédito (InfinitePay)'}
                              {t.formaPagamento === 'cartao_debito' && '💳 Cartão Débito'}
                              {t.formaPagamento === 'dinheiro' && '💵 Dinheiro'}
                              {t.formaPagamento === 'transferencia' && '🏦 Transferência'}
                              {t.formaPagamento === 'boleto' && '📄 Boleto'}
                              {t.formaPagamento === 'pacote' && '📦 Pacote'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
                              className={`font-bold font-mono text-sm ${
                                isReceita ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {isReceita ? '+' : '-'} R$ {t.valor.toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onExcluirTransacao(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= SUB-TAB 2: CONTROLE DE PACOTES DE SESSÕES ======================= */}
      {subTab === 'pacotes' && (
        <div className="space-y-4">
          {/* Pacotes Header & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Pacotes Ativos
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-700">
                {pacotesAtivos.length} clientes
              </div>
              <p className="text-xs text-slate-500">Pacotes em andamento</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Sessões Realizadas / Contratadas
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {totalSessoesRealizadas} <span className="text-slate-400 text-lg">/ {totalSessoesContratadas}</span>
              </div>
              <p className="text-xs text-slate-500">Total acumulado em pacotes</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Sessões a Realizar (Crédito)
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700">
                {totalSessoesPendentes} sessões
              </div>
              <p className="text-xs text-slate-500">Pendentes de atendimento</p>
            </div>
          </div>

          {/* Cards List of Packages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Pacotes de Sessões Contratados ({pacotesSessoes.length})
              </h3>
              <button
                type="button"
                onClick={() => setModalNovoPacote(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Novo Pacote</span>
              </button>
            </div>

            {pacotesSessoes.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-sm">Nenhum pacote vendido ainda.</p>
                <p className="mt-1">Clique no botão acima para cadastrar a venda de um pacote de 8 ou mais sessões.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pacotesSessoes.map((pacote) => {
                  const perc = Math.min(100, Math.round((pacote.sessoesRealizadas / pacote.totalSessoes) * 100));
                  const restam = Math.max(0, pacote.totalSessoes - pacote.sessoesRealizadas);
                  const isConcluido = pacote.status === 'concluido' || restam === 0;

                  return (
                    <div
                      key={pacote.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                        isConcluido ? 'border-slate-200 bg-slate-50/60' : 'border-indigo-200 hover:border-indigo-400'
                      }`}
                    >
                      {/* Top Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {pacote.procedimentoNome}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{pacote.pacienteNome}</h4>
                            {pacote.pacienteWhatsapp && (
                              <p className="text-[11px] text-slate-500 font-mono">{pacote.pacienteWhatsapp}</p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isConcluido
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isConcluido ? 'Pacote Concluído' : 'Em Andamento'}
                            </span>
                            <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                              R$ {pacote.valorTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar (Pagas vs Realizadas) */}
                        <div className="mt-3 bg-slate-100 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              Progresso das Sessões:
                            </span>
                            <span className="font-bold font-mono text-indigo-900">
                              {pacote.sessoesRealizadas} de {pacote.totalSessoes} realizadas ({perc}%)
                            </span>
                          </div>

                          {/* Progress bar visual */}
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${perc}%` }}
                              className={`h-full transition-all duration-300 ${
                                isConcluido ? 'bg-slate-500' : 'bg-gradient-to-r from-indigo-600 to-emerald-500'
                              }`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>Contratado em: {new Date(pacote.dataContratacao + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                            <span className="font-bold text-indigo-700">
                              {restam === 0 ? '✨ Concluído' : `Restam ${restam} sessão(ões)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500">
                          {pacote.historicoRealizacoes?.length || 0} registro(s) de sessão
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isConcluido && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalRegistrarSessao(pacote);
                                setSessaoData(new Date().toISOString().split('T')[0]);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Registrar Sessão (+1)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onExcluirPacote(pacote.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir pacote"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODAL: NOVO LANÇAMENTO FINANCEIRO ======================= */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Livro Caixa
                </span>
                <h3 className="font-bold text-sm sm:text-base">Novo Lançamento Financeiro</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao} className="p-5 space-y-4 text-xs">
              {/* Switcher: Entrada (Receita) vs Saída (Custo) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormTipo('receita')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    formTipo === 'receita'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟢 + Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo('despesa')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    formTipo === 'despesa'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔴 - Saída (Custo/Despesa)
                </button>
              </div>

              {/* CAMPOS ESPECÍFICOS PARA RECEITA */}
              {formTipo === 'receita' && (
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-3">
                  <div>
                    <label className="font-bold text-emerald-950 block mb-1">
                      Procedimento / Serviço Contratado *
                    </label>
                    <select
                      value={formProcedimentoId}
                      onChange={(e) => handleSelectProcedimentoReceita(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {procedimentos.map((proc) => (
                        <option key={proc.id} value={proc.id}>
                          {proc.nome} (R$ {proc.precoTotal.toFixed(2)})
                        </option>
                      ))}
                      <option value="">Outro / Serviço Avulso</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-emerald-950 block mb-1">
                      Vincular ao Paciente (Opcional)
                    </label>
                    <select
                      value={formPacienteId}
                      onChange={(e) => setFormPacienteId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Nenhum / Paciente Avulso --</option>
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* CAMPOS ESPECÍFICOS PARA CUSTO / DESPESA */}
              {formTipo === 'despesa' && (
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-3">
                  <div>
                    <label className="font-bold text-rose-950 block mb-1">
                      Categoria do Custo *
                    </label>
                    {!isCriandoNovaCategoriaDespesa ? (
                      <select
                        value={formCategoriaDespesa}
                        onChange={(e) => {
                          if (e.target.value === '__NOVA_CATEGORIA__') {
                            setIsCriandoNovaCategoriaDespesa(true);
                          } else {
                            setFormCategoriaDespesa(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                      >
                        {listaCategoriasDespesa.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__NOVA_CATEGORIA__">✨ + Criar Nova Categoria...</option>
                      </select>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Digite o nome da nova categoria..."
                          value={novaCategoriaInput}
                          onChange={(e) => setNovaCategoriaInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-rose-400 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCriandoNovaCategoriaDespesa(false)}
                          className="text-[11px] text-rose-700 hover:underline font-semibold"
                        >
                          ← Voltar para lista de categorias
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    formTipo === 'receita'
                      ? 'Ex: Pagamento sessão Drenagem - Paciente Carlos'
                      : 'Ex: Compra de óleos vegetais de massagem e descartáveis'
                  }
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Valor & Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data</label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Forma de Pagamento</label>
                <select
                  value={formFormaPagto}
                  onChange={(e) => setFormFormaPagto(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <option value="pix_infinitepay">⚡ Pix Instantâneo InfinitePay</option>
                  <option value="cartao_credito">💳 Cartão de Crédito (InfinitePay / Link)</option>
                  <option value="dinheiro">💵 Dinheiro Presencial</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="transferencia">🏦 Transferência Bancária</option>
                  <option value="boleto">📄 Boleto</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: NOVO PACOTE DE SESSÕES ======================= */}
      {modalNovoPacote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">
                  Controle de Sessões
                </span>
                <h3 className="font-bold text-sm sm:text-base">Venda de Pacote de Sessões</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoPacote(false)}
                className="text-indigo-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovoPacote} className="p-5 space-y-3.5 text-xs">
              {/* Paciente */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Paciente *</label>
                <select
                  required
                  value={pacotePacienteId}
                  onChange={(e) => setPacotePacienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.whatsapp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Procedimento */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Procedimento / Tratamento *</label>
                <select
                  required
                  value={pacoteProcedimentoId}
                  onChange={(e) => {
                    setPacoteProcedimentoId(e.target.value);
                    const proc = procedimentos.find((p) => p.id === e.target.value);
                    if (proc) {
                      const qtd = proc.tipo === 'pacote' && proc.quantidadeSessoes ? proc.quantidadeSessoes : pacoteTotalSessoes;
                      setPacoteTotalSessoes(qtd);
                      const valor = proc.tipo === 'pacote' ? proc.precoTotal : proc.precoTotal * qtd;
                      setPacoteValorTotal(valor.toString());
                      setPacoteValorPago(valor.toString());
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  {procedimentos.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.nome} {proc.tipo === 'pacote' ? `(Pacote Fechado: R$ ${proc.precoTotal.toFixed(2)})` : `(R$ ${proc.precoTotal.toFixed(2)} / sessão)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade de Sessões (Padrão 8) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total de Sessões *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={pacoteTotalSessoes}
                    onChange={(e) => {
                      const qtd = parseInt(e.target.value) || 8;
                      setPacoteTotalSessoes(qtd);
                      const proc = procedimentos.find((p) => p.id === pacoteProcedimentoId);
                      if (proc) {
                        setPacoteValorTotal((proc.precoTotal * qtd).toString());
                        setPacoteValorPago((proc.precoTotal * qtd).toString());
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Ex: 8 sessões</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pacoteValorTotal}
                    onChange={(e) => setPacoteValorTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Valor Pago & Forma de Pagamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor Pago (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pacoteValorPago}
                    onChange={(e) => setPacoteValorPago(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forma de Pagto</label>
                  <select
                    value={pacoteFormaPagamento}
                    onChange={(e) => setPacoteFormaPagamento(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="cartao_credito">💳 Cartão Crédito</option>
                    <option value="cartao_debito">💳 Cartão Débito</option>
                    <option value="pix_inter">🔑 Pix Inter</option>
                  </select>
                </div>
              </div>

              {/* Checkbox: Lançar no Financeiro */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={pacoteGerarLancamentoFinanceiro}
                  onChange={(e) => setPacoteGerarLancamentoFinanceiro(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Registrar entrada financeira automaticamente no Livro Caixa
                </span>
              </label>

              {/* Observações */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observações do Pacote</label>
                <input
                  type="text"
                  placeholder="Ex: Pacote de reabilitação e alívio de dor lombar"
                  value={pacoteObservacoes}
                  onChange={(e) => setPacoteObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPacote(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Confirmar Pacote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: REGISTRAR SESSÃO REALIZADA ======================= */}
      {modalRegistrarSessao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-700">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
                  Presença & Atendimento
                </span>
                <h3 className="font-bold text-sm sm:text-base">Registrar Sessão Realizada</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRegistrarSessao(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarSessaoRealizada} className="p-5 space-y-3.5 text-xs">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950 text-sm">{modalRegistrarSessao.pacienteNome}</div>
                <div className="text-xs text-emerald-800">
                  {modalRegistrarSessao.procedimentoNome} •{' '}
                  <strong>
                    Sessão {modalRegistrarSessao.sessoesRealizadas + 1} de {modalRegistrarSessao.totalSessoes}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data da Sessão *</label>
                  <input
                    type="date"
                    required
                    value={sessaoData}
                    onChange={(e) => setSessaoData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário</label>
                  <input
                    type="time"
                    value={sessaoHorario}
                    onChange={(e) => setSessaoHorario(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terapeuta Responsável</label>
                <input
                  type="text"
                  value={sessaoTerapeuta}
                  onChange={(e) => setSessaoTerapeuta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observações da Sessão</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Trabalho focal em região dorsal, paciente relatou alívio de tensão."
                  value={sessaoObservacoes}
                  onChange={(e) => setSessaoObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalRegistrarSessao(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Confirmar Presença (+1 Sessão)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
