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
  onNovaTransacao: (transacao: TransacaoFinanceira | TransacaoFinanceira[]) => void;
  onExcluirTransacao: (transacaoId: string | string[]) => void;
  onNovoPacote: (pacote: PacoteSessoes) => void;
  onAtualizarPacote: (pacote: PacoteSessoes) => void;
  onExcluirPacote: (pacoteId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export type PeriodoFiltro = 'esta_semana' | 'semana_passada' | 'este_mes' | 'mes_passado' | 'proximo_mes' | 'todos' | 'personalizado';
export type TipoTransacaoFiltro = 'todos' | 'receita' | 'despesa' | 'parceladas';

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

// Helper seguro para formatar data YYYY-MM-DD no fuso horário local
const toLocalYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper para calcular datas de vencimento mensais preservando o dia de vencimento da fatura do cartão
const calculateInstallmentDates = (startDateStr: string, count: number): string[] => {
  const [startYear, startMonth, startDay] = (startDateStr || toLocalYYYYMMDD(new Date())).split('-').map(Number);
  const dates: string[] = [];

  for (let i = 0; i < count; i++) {
    const targetMonthIndex = (startMonth - 1) + i;
    const targetYear = startYear + Math.floor(targetMonthIndex / 12);
    const targetMonth = (targetMonthIndex % 12); // 0-11
    
    // Obter quantidade de dias no mês alvo para não estourar (ex: dia 31 em abril vira 30)
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualDay = Math.min(startDay, daysInTargetMonth);
    
    const y = targetYear;
    const m = String(targetMonth + 1).padStart(2, '0');
    const d = String(actualDay).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
  }
  return dates;
};

// Helper resiliente para ler valores numéricos (aceita 150, 150,00, 150.00, R$ 150,00)
const parseMoneyInput = (input: string | number): number => {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  let clean = input.toString().replace(/[R$\s]/g, '').trim();
  if (clean.includes(',') && clean.includes('.')) {
    // Ex: 1.250,50 -> 1250.50
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // Ex: 150,50 -> 150.50
    clean = clean.replace(',', '.');
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

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

  // Period and Type Filters via Dropdown (padrão 'todos' para que qualquer lançamento apareça imediatamente)
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoTransacaoFiltro>('todos');

  // Destaque visual temporário para o lançamento recém-criado
  const [recemCriadaId, setRecemCriadaId] = useState<string | null>(null);

  // Modals state
  const [modalNovo, setModalNovo] = useState(false);
  const [modalNovoPacote, setModalNovoPacote] = useState(false);
  const [modalRegistrarSessao, setModalRegistrarSessao] = useState<PacoteSessoes | null>(null);

  // Modal para exclusão inteligente de parcelamento
  const [modalExcluirParcelamento, setModalExcluirParcelamento] = useState<{
    transacao: TransacaoFinanceira;
    todasParcelas: TransacaoFinanceira[];
  } | null>(null);

  // Form states - Transação
  const [formTipo, setFormTipo] = useState<'receita' | 'despesa'>('receita');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formData, setFormData] = useState(toLocalYYYYMMDD(new Date()));
  const [formFormaPagto, setFormFormaPagto] = useState<TransacaoFinanceira['formaPagamento']>('dinheiro');

  // Form states - Despesa Parcelada (Cartão de Crédito / Fatura)
  const [formIsParcelado, setFormIsParcelado] = useState(false);
  const [formNumeroParcelas, setFormNumeroParcelas] = useState(2);
  const [formDataPrimeiroVencimento, setFormDataPrimeiroVencimento] = useState(toLocalYYYYMMDD(new Date()));
  const [formModoValor, setFormModoValor] = useState<'total' | 'parcela'>('total');
  
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
  const [sessaoData, setSessaoData] = useState(toLocalYYYYMMDD(new Date()));
  const [sessaoHorario, setSessaoHorario] = useState('14:00');
  const [sessaoObservacoes, setSessaoObservacoes] = useState('');
  const [sessaoTerapeuta, setSessaoTerapeuta] = useState(configClinica.nomeTerapeuta || 'Terapeuta');

  // Helpers for date ranges calculados estritamente no fuso local
  const dateRanges = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

    // Esta semana (segunda a domingo)
    const startThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const endThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + 6);

    // Semana passada
    const startLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday - 7);
    const endLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday - 1);

    // Este mês
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Mês passado
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Próximo mês (ideal para previsão de faturas e parcelas futuras)
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return {
      estaSemana: { inicio: toLocalYYYYMMDD(startThisWeek), fim: toLocalYYYYMMDD(endThisWeek) },
      semanaPassada: { inicio: toLocalYYYYMMDD(startLastWeek), fim: toLocalYYYYMMDD(endLastWeek) },
      esteMes: { inicio: toLocalYYYYMMDD(startThisMonth), fim: toLocalYYYYMMDD(endThisMonth) },
      mesPassado: { inicio: toLocalYYYYMMDD(startLastMonth), fim: toLocalYYYYMMDD(endLastMonth) },
      proximoMes: { inicio: toLocalYYYYMMDD(startNextMonth), fim: toLocalYYYYMMDD(endNextMonth) },
    };
  }, []);

  // Filter transactions
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      // Type filter
      if (tipoFiltro === 'receita' && t.tipo !== 'receita') return false;
      if (tipoFiltro === 'despesa' && t.tipo !== 'despesa') return false;
      if (tipoFiltro === 'parceladas' && !t.parcelado) return false;

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
      if (periodo === 'proximo_mes') {
        return t.data >= dateRanges.proximoMes.inicio && t.data <= dateRanges.proximoMes.fim;
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

  const totalDespesasParceladas = useMemo(() => {
    return transacoesFiltradas
      .filter((t) => t.tipo === 'despesa' && t.parcelado)
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
  const handleSelectProcedimentoReceita = (procId: string, customPacienteId?: string) => {
    setFormProcedimentoId(procId);
    const proc = procedimentos.find((p) => p.id === procId);
    const targetPacId = customPacienteId !== undefined ? customPacienteId : formPacienteId;
    const pac = pacientes.find((p) => p.id === targetPacId);
    if (proc) {
      if (pac) {
        setFormDescricao(`Atendimento: ${proc.nome} - ${pac.nome}`);
      } else {
        setFormDescricao(`Atendimento Presencial: ${proc.nome}`);
      }
      setFormValor(proc.precoTotal.toString());
    } else {
      if (pac) {
        setFormDescricao(`Atendimento Avulso - ${pac.nome}`);
      } else {
        setFormDescricao('Serviço Avulso / Procedimento');
      }
    }
  };

  // Handle new transaction submit
  const handleSalvarTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseMoneyInput(formValor);
    if (val <= 0) {
      onShowToast('Atenção', 'Informe um valor válido maior que zero.', 'error');
      return;
    }
    if (!formDescricao.trim()) {
      onShowToast('Atenção', 'Informe uma descrição para o lançamento.', 'error');
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
    const dataTransacao = formData || toLocalYYYYMMDD(new Date());

    // Se for uma Despesa Parcelada (Cartão de Crédito / Fatura)
    if (formTipo === 'despesa' && formIsParcelado && formNumeroParcelas > 1) {
      const parcelamentoId = `parc-${Date.now()}`;
      const dataVencInicial = formDataPrimeiroVencimento || formData || toLocalYYYYMMDD(new Date());
      const datas = calculateInstallmentDates(dataVencInicial, formNumeroParcelas);

      let totalCompra = 0;
      let valorBasePorParcela = 0;
      let restoCentavos = 0;

      if (formModoValor === 'total') {
        totalCompra = val;
        valorBasePorParcela = Math.floor((totalCompra / formNumeroParcelas) * 100) / 100;
        restoCentavos = Math.round((totalCompra - valorBasePorParcela * formNumeroParcelas) * 100) / 100;
      } else {
        valorBasePorParcela = val;
        totalCompra = Math.round(valorBasePorParcela * formNumeroParcelas * 100) / 100;
      }

      const listaNovasParcelas: TransacaoFinanceira[] = datas.map((dtVenc, idx) => {
        const numParcela = idx + 1;
        // Na primeira parcela, ajusta eventuais centavos de arredondamento
        const valorDestaParcela =
          formModoValor === 'total' && idx === 0
            ? Math.round((valorBasePorParcela + restoCentavos) * 100) / 100
            : valorBasePorParcela;

        return {
          id: `fin-${Date.now()}-${numParcela}-${Math.random().toString(36).substring(2, 6)}`,
          tipo: 'despesa',
          categoria: categoriaFinal,
          categoriaNome: categoriaNome,
          descricao: `${formDescricao.trim()} (${numParcela}/${formNumeroParcelas})`,
          valor: valorDestaParcela,
          data: dtVenc, // Cada parcela fica agendada na data de vencimento da fatura correspondente
          formaPagamento: formFormaPagto || 'cartao_credito',
          status: 'confirmado',
          criadoEm: new Date().toISOString(),
          parcelado: true,
          parcelaAtual: numParcela,
          totalParcelas: formNumeroParcelas,
          parcelamentoId: parcelamentoId,
          dataVencimentoFatura: dtVenc,
          valorTotalParcelamento: totalCompra,
        };
      });

      onNovaTransacao(listaNovasParcelas);

      // Se o período filtrado for restrito e não abranger todo o parcelamento, ajusta para 'todos'
      if (periodo !== 'todos') {
        setPeriodo('todos');
      }

      onShowToast(
        'Despesa Parcelada com Sucesso!',
        `${formNumeroParcelas} parcelas de R$ ${valorBasePorParcela.toFixed(2)} (Total: R$ ${totalCompra.toFixed(2)}) lançadas com vencimento no dia ${dataVencInicial.split('-')[2]} de cada mês.`,
        'success'
      );

      setSubTab('movimentacoes');
      setRecemCriadaId(listaNovasParcelas[0]?.id || null);
      setTimeout(() => setRecemCriadaId(null), 8000);

      setModalNovo(false);
      setFormDescricao('');
      setFormValor('');
      setFormIsParcelado(false);
      setFormNumeroParcelas(2);
      setFormModoValor('total');
      setFormPacienteId('');
      setIsCriandoNovaCategoriaDespesa(false);
      setNovaCategoriaInput('');
      return;
    }

    const nova: TransacaoFinanceira = {
      id: `fin-${Date.now()}`,
      tipo: formTipo,
      categoria: categoriaFinal,
      categoriaNome: categoriaNome,
      descricao: formDescricao.trim(),
      valor: val,
      data: dataTransacao,
      formaPagamento: formFormaPagto,
      pacienteId: paciente?.id || undefined,
      pacienteNome: paciente?.nome || undefined,
      procedimentoId: formProcedimentoId || undefined,
      status: 'confirmado',
      comprovanteRef:
        formFormaPagto === 'pix_inter' || formFormaPagto === 'pix_infinitepay'
          ? `PIX-${Math.floor(100000 + Math.random() * 900000)}`
          : undefined,
      criadoEm: new Date().toISOString(),
    };

    onNovaTransacao(nova);

    // Ajusta o filtro automaticamente se a data do lançamento não estiver visível no período atual
    let avisoAjusteFiltro = '';
    if (periodo === 'este_mes' && (dataTransacao < dateRanges.esteMes.inicio || dataTransacao > dateRanges.esteMes.fim)) {
      setPeriodo('todos');
      avisoAjusteFiltro = ' (Filtro ajustado para "Todo o Período")';
    } else if (periodo === 'esta_semana' && (dataTransacao < dateRanges.estaSemana.inicio || dataTransacao > dateRanges.estaSemana.fim)) {
      setPeriodo('todos');
      avisoAjusteFiltro = ' (Filtro ajustado para "Todo o Período")';
    } else if (periodo === 'semana_passada' && (dataTransacao < dateRanges.semanaPassada.inicio || dataTransacao > dateRanges.semanaPassada.fim)) {
      setPeriodo('todos');
      avisoAjusteFiltro = ' (Filtro ajustado para "Todo o Período")';
    } else if (periodo === 'mes_passado' && (dataTransacao < dateRanges.mesPassado.inicio || dataTransacao > dateRanges.mesPassado.fim)) {
      setPeriodo('todos');
      avisoAjusteFiltro = ' (Filtro ajustado para "Todo o Período")';
    } else if (periodo === 'personalizado' && ((dataInicioCustom && dataTransacao < dataInicioCustom) || (dataFimCustom && dataTransacao > dataFimCustom))) {
      setPeriodo('todos');
      avisoAjusteFiltro = ' (Filtro ajustado para "Todo o Período")';
    }

    onShowToast(
      'Lançamento Registrado com Sucesso!',
      `${formTipo === 'receita' ? '+' : '-'} R$ ${val.toFixed(2)} - ${nova.descricao}${avisoAjusteFiltro}`,
      'success'
    );

    // Garante visualização na aba de movimentações e destaca a linha
    setSubTab('movimentacoes');
    setRecemCriadaId(nova.id);
    setTimeout(() => setRecemCriadaId(null), 8000);

    setModalNovo(false);
    setFormDescricao('');
    setFormValor('');
    setFormPacienteId('');
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
              setFormData(toLocalYYYYMMDD(new Date()));
              setFormPacienteId('');
              setFormTipo('receita');
              if (procedimentos.length > 0) {
                handleSelectProcedimentoReceita(procedimentos[0].id, '');
              } else {
                setFormDescricao('Atendimento Presencial');
                setFormValor('');
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
                    <option value="proximo_mes">🗓️ Próximo Mês (Faturas Futuras)</option>
                    <option value="mes_passado">🗓️ Mês Passado</option>
                    <option value="todos">🌐 Todo o Período</option>
                    <option value="personalizado">🔍 Período Personalizado...</option>
                  </select>
                </div>
              </div>

              {/* Dropdown de Tipo de Transação (Todos / Entradas / Custos / Parceladas) */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Tipo de Lançamento:</span>
                </div>
                <div className="relative flex-1 sm:w-56">
                  <select
                    id="select-tipo-transacao"
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value as TipoTransacaoFiltro)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                  >
                    <option value="todos">🔹 Todos os Lançamentos</option>
                    <option value="receita">🟢 Apenas Entradas (Receitas)</option>
                    <option value="despesa">🔴 Apenas Custos (Despesas)</option>
                    <option value="parceladas">💳 Apenas Parceladas (Faturas de Cartão)</option>
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
              <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
                <span>{transacoesFiltradas.filter((t) => t.tipo === 'despesa').length} lançamento(s)</span>
                {totalDespesasParceladas > 0 && (
                  <span className="text-indigo-600 font-semibold flex items-center gap-1" title="Parcelas de fatura de cartão no período filtrado">
                    <CreditCard className="w-3 h-3" />
                    R$ {totalDespesasParceladas.toFixed(2)} em faturas
                  </span>
                )}
              </div>
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

          {/* AVISO DE FILTRO ATIVO (quando houver transações ocultas pelo filtro) */}
          {transacoesFiltradas.length < transacoes.length && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Filtro ativo: exibindo <strong>{transacoesFiltradas.length}</strong> de <strong>{transacoes.length}</strong> lançamentos no total.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPeriodo('todos');
                  setTipoFiltro('todos');
                  setDataInicioCustom('');
                  setDataFimCustom('');
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Limpar filtros e ver todos ({transacoes.length})
              </button>
            </div>
          )}

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
                <p className="font-semibold text-slate-700">Nenhum lançamento encontrado para o período e filtros selecionados.</p>
                {transacoes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-500 mb-2">
                      Existem <strong>{transacoes.length}</strong> lançamento(s) cadastrado(s) em outras datas ou categorias.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodo('todos');
                        setTipoFiltro('todos');
                        setDataInicioCustom('');
                        setDataFimCustom('');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all"
                    >
                      Exibir Todos os Lançamentos ({transacoes.length})
                    </button>
                  </div>
                )}
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
                      const isRecemCriada = t.id === recemCriadaId;
                      const dataFormatada = new Date(t.data + 'T12:00:00Z').toLocaleDateString('pt-BR');

                      return (
                        <tr
                          key={t.id}
                          className={`transition-all duration-300 ${
                            isRecemCriada
                              ? 'bg-emerald-50/95 border-l-4 border-l-emerald-600 shadow-xs'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{t.descricao}</span>
                              {t.parcelado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <CreditCard className="w-3 h-3 text-indigo-600" />
                                  Fatura {t.parcelaAtual}/{t.totalParcelas}
                                </span>
                              )}
                              {isRecemCriada && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-950 animate-pulse">
                                  ✨ Lançamento Recente
                                </span>
                              )}
                            </div>
                            {t.parcelado && t.valorTotalParcelamento && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Valor total da compra parcelada: <strong className="font-mono text-slate-700">R$ {t.valorTotalParcelamento.toFixed(2)}</strong>
                              </div>
                            )}
                            {t.pacienteNome && (
                              <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Paciente: <strong>{t.pacienteNome}</strong></span>
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
                              {t.formaPagamento === 'cartao_credito' && '💳 Cartão Crédito'}
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
                              onClick={() => {
                                if (t.parcelado && t.parcelamentoId) {
                                  const grupo = transacoes.filter((tx) => tx.parcelamentoId === t.parcelamentoId);
                                  if (grupo.length > 1) {
                                    setModalExcluirParcelamento({
                                      transacao: t,
                                      todasParcelas: grupo,
                                    });
                                    return;
                                  }
                                }
                                if (window.confirm(`Deseja realmente excluir o lançamento "${t.descricao}"?`)) {
                                  onExcluirTransacao(t.id);
                                }
                              }}
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
                      onChange={(e) => {
                        const selPacId = e.target.value;
                        setFormPacienteId(selPacId);
                        const p = pacientes.find((pac) => pac.id === selPacId);
                        const proc = procedimentos.find((pr) => pr.id === formProcedimentoId);
                        if (p) {
                          if (!formDescricao || formDescricao.startsWith('Atendimento Presencial:') || formDescricao.startsWith('Atendimento:')) {
                            setFormDescricao(`Atendimento: ${proc ? proc.nome : 'Serviço'} - ${p.nome}`);
                          }
                        } else if (proc) {
                          setFormDescricao(`Atendimento Presencial: ${proc.nome}`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs text-slate-800 focus:outline-none cursor-pointer"
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
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0,00"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Aceita vírgula ou ponto (ex: 150,00)</span>
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
                  <option value="cartao_credito">💳 Cartão de Crédito (Fatura / Link)</option>
                  <option value="dinheiro">💵 Dinheiro Presencial</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="transferencia">🏦 Transferência Bancária</option>
                  <option value="boleto">📄 Boleto</option>
                </select>
              </div>

              {/* Opção de Despesa Parcelada (Cartão de Crédito / Fatura) */}
              {formTipo === 'despesa' && (
                <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950 text-xs">
                      <input
                        type="checkbox"
                        checked={formIsParcelado}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormIsParcelado(checked);
                          if (checked) {
                            setFormFormaPagto('cartao_credito');
                            if (!formDataPrimeiroVencimento) {
                              setFormDataPrimeiroVencimento(formData || toLocalYYYYMMDD(new Date()));
                            }
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Despesa Parcelada (ex: Cartão de Crédito)
                      </span>
                    </label>
                    {formIsParcelado && (
                      <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-mono">
                        {formNumeroParcelas}x
                      </span>
                    )}
                  </div>

                  {formIsParcelado && (
                    <div className="space-y-3 pt-2 border-t border-indigo-200/80 animate-in fade-in duration-150">
                      {/* Modo de Valor e Parcelas */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-semibold text-indigo-950 block mb-1">
                            Qtd. de Parcelas
                          </label>
                          <select
                            value={formNumeroParcelas}
                            onChange={(e) => setFormNumeroParcelas(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((num) => (
                              <option key={num} value={num}>
                                {num}x vezes
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-indigo-950 block mb-1">
                            1º Vencimento (Fatura) *
                          </label>
                          <input
                            type="date"
                            required={formIsParcelado}
                            value={formDataPrimeiroVencimento}
                            onChange={(e) => setFormDataPrimeiroVencimento(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Modo do Valor: Total ou Por Parcela */}
                      <div>
                        <label className="font-semibold text-indigo-950 block mb-1">
                          O valor informado de {formValor ? `R$ ${formValor}` : 'R$ 0,00'} representa:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer text-[11px] transition-all ${
                              formModoValor === 'total'
                                ? 'bg-white border-indigo-500 font-bold text-indigo-950 shadow-xs'
                                : 'bg-indigo-100/50 border-transparent text-indigo-800 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="modoValor"
                              value="total"
                              checked={formModoValor === 'total'}
                              onChange={() => setFormModoValor('total')}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Valor Total da Compra</span>
                          </label>

                          <label
                            className={`flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer text-[11px] transition-all ${
                              formModoValor === 'parcela'
                                ? 'bg-white border-indigo-500 font-bold text-indigo-950 shadow-xs'
                                : 'bg-indigo-100/50 border-transparent text-indigo-800 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="modoValor"
                              value="parcela"
                              checked={formModoValor === 'parcela'}
                              onChange={() => setFormModoValor('parcela')}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Valor de Cada Parcela</span>
                          </label>
                        </div>
                      </div>

                      {/* Caixa de Pré-visualização do Cronograma de Faturas */}
                      {(() => {
                        const parsedVal = parseMoneyInput(formValor);
                        if (parsedVal <= 0) return null;

                        let totalCalculado = 0;
                        let porParcelaCalculado = 0;
                        if (formModoValor === 'total') {
                          totalCalculado = parsedVal;
                          porParcelaCalculado = totalCalculado / formNumeroParcelas;
                        } else {
                          porParcelaCalculado = parsedVal;
                          totalCalculado = porParcelaCalculado * formNumeroParcelas;
                        }

                        const dataBase = formDataPrimeiroVencimento || formData || toLocalYYYYMMDD(new Date());
                        const previewDatas = calculateInstallmentDates(dataBase, Math.min(formNumeroParcelas, 4));

                        return (
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-200 text-[11px] space-y-1.5">
                            <div className="flex items-center justify-between text-indigo-900 font-bold">
                              <span>Plano de Faturas: {formNumeroParcelas}x de R$ {porParcelaCalculado.toFixed(2)}</span>
                              <span className="font-mono text-indigo-700">Total: R$ {totalCalculado.toFixed(2)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 pt-1 border-t border-slate-100">
                              {previewDatas.map((dt, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span>Parcela {idx + 1}/{formNumeroParcelas}:</span>
                                  <span className="font-mono text-slate-700 font-semibold">
                                    Vencimento {new Date(dt + 'T12:00:00Z').toLocaleDateString('pt-BR')} (R$ {porParcelaCalculado.toFixed(2)})
                                  </span>
                                </div>
                              ))}
                              {formNumeroParcelas > 4 && (
                                <div className="text-slate-400 italic text-[9px] text-right">
                                  + {formNumeroParcelas - 4} parcela(s) subsequente(s)...
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

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

      {/* ======================= MODAL: EXCLUSÃO DE DESPESA PARCELADA ======================= */}
      {modalExcluirParcelamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Excluir Despesa Parcelada</h3>
                  <span className="text-[10px] text-slate-400">
                    Fatura {modalExcluirParcelamento.transacao.parcelaAtual} de {modalExcluirParcelamento.transacao.totalParcelas}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalExcluirParcelamento(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700">
                O lançamento <strong>"{modalExcluirParcelamento.transacao.descricao}"</strong> faz parte de uma despesa parcelada no cartão com um total de <strong>{modalExcluirParcelamento.todasParcelas.length} parcelas</strong> cadastradas.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Valor desta parcela:</span>
                  <strong className="font-mono text-slate-900">R$ {modalExcluirParcelamento.transacao.valor.toFixed(2)}</strong>
                </div>
                {modalExcluirParcelamento.transacao.valorTotalParcelamento && (
                  <div className="flex justify-between text-slate-600">
                    <span>Valor total do parcelamento:</span>
                    <strong className="font-mono text-indigo-700">R$ {modalExcluirParcelamento.transacao.valorTotalParcelamento.toFixed(2)}</strong>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Vencimento desta parcela:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(modalExcluirParcelamento.transacao.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onExcluirTransacao(modalExcluirParcelamento.transacao.id);
                    onShowToast(
                      'Parcela Excluída',
                      `A parcela ${modalExcluirParcelamento.transacao.parcelaAtual}/${modalExcluirParcelamento.transacao.totalParcelas} foi removida. As demais permanecem no caixa.`,
                      'info'
                    );
                    setModalExcluirParcelamento(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all cursor-pointer text-center"
                >
                  Excluir Apenas Esta Parcela ({modalExcluirParcelamento.transacao.parcelaAtual}/{modalExcluirParcelamento.transacao.totalParcelas})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ids = modalExcluirParcelamento.todasParcelas.map((tx) => tx.id);
                    onExcluirTransacao(ids);
                    onShowToast(
                      'Parcelamento Completo Excluído',
                      `Todas as ${ids.length} parcelas desta compra foram excluídas do caixa.`,
                      'info'
                    );
                    setModalExcluirParcelamento(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer text-center"
                >
                  Excluir Todas as {modalExcluirParcelamento.todasParcelas.length} Parcelas do Cartão
                </button>

                <button
                  type="button"
                  onClick={() => setModalExcluirParcelamento(null)}
                  className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer text-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
