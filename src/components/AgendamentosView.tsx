import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Send,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Phone,
  Sliders,
  Settings2,
  Check,
  X,
  CalendarOff,
  Sun,
} from 'lucide-react';
import { Agendamento, ConfiguracaoClinica, ConfiguracaoInter, StatusPagamento, ExcecaoDataDisponibilidade } from '../types';
import { abrirWhatsAppComTexto } from '../services/pdfGenerator';
import { formatarDataBR } from '../utils/dateUtils';

interface AgendamentosViewProps {
  agendamentos: Agendamento[];
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  isGoogleConnected: boolean;
  onSalvarClinica?: (config: ConfiguracaoClinica) => void;
  onOpenNovoAgendamento: () => void;
  onOpenPixModal: (agendamento: Agendamento) => void;
  onConfirmarSinal: (agendamentoId: string, metodo: 'pix_inter') => void;
  onReceberRestanteEConcluir: (agendamento: Agendamento) => void;
  onAtualizarStatusPagamento: (agendamentoId: string, novoStatus: StatusPagamento) => void;
  onSincronizarGoogleCalendar: (agendamento: Agendamento) => void;
  onIniciarEvolucao: (agendamento: Agendamento) => void;
  onExcluirAgendamento: (agendamentoId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgendamentosView: React.FC<AgendamentosViewProps> = ({
  agendamentos,
  configClinica,
  configInter,
  isGoogleConnected,
  onSalvarClinica,
  onOpenNovoAgendamento,
  onOpenPixModal,
  onConfirmarSinal,
  onReceberRestanteEConcluir,
  onAtualizarStatusPagamento,
  onSincronizarGoogleCalendar,
  onIniciarEvolucao,
  onExcluirAgendamento,
  onShowToast,
}) => {
  const hojeStr = new Date().toISOString().split('T')[0];
  const [filtroData, setFiltroData] = useState<'hoje' | 'semana' | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPagamento, setFiltroPagamento] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal de Configuração de Disponibilidade da Terapeuta
  const [modalDisponibilidade, setModalDisponibilidade] = useState(false);
  const [abaDisponibilidade, setAbaDisponibilidade] = useState<'semana' | 'excecoes'>('semana');
  const [diasAtendimento, setDiasAtendimento] = useState<number[]>(
    configClinica.diasSemanaDisponiveis || [1, 2, 3, 4, 5, 6]
  );
  const [horariosGrade, setHorariosGrade] = useState<string[]>(
    configClinica.horariosDisponiveis || ['08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45']
  );
  const [novoHorarioInput, setNovoHorarioInput] = useState('');
  const [geradorInicio, setGeradorInicio] = useState('08:30');
  const [geradorFim, setGeradorFim] = useState('19:30');
  const [geradorIntervalo, setGeradorIntervalo] = useState('75');

  // Exceções de Datas Específicas (Bloqueios totais ou horários específicos como apenas à tarde)
  const [excecoesList, setExcecoesList] = useState<ExcecaoDataDisponibilidade[]>(
    configClinica.excecoesDias || []
  );
  const [novaExcecaoData, setNovaExcecaoData] = useState<string>('');
  const [novaExcecaoTipo, setNovaExcecaoTipo] = useState<'fechado' | 'personalizado'>('personalizado');
  const [novaExcecaoMotivo, setNovaExcecaoMotivo] = useState<string>('');
  const [novaExcecaoHorarios, setNovaExcecaoHorarios] = useState<string[]>([
    '13:30', '14:45', '16:00', '17:15', '18:30'
  ]);
  const [novoHorarioExcecaoInput, setNovoHorarioExcecaoInput] = useState('');

  // Sincroniza estado inicial com configClinica
  useEffect(() => {
    if (configClinica.diasSemanaDisponiveis) {
      setDiasAtendimento(configClinica.diasSemanaDisponiveis);
    }
    if (configClinica.horariosDisponiveis && configClinica.horariosDisponiveis.length > 0) {
      setHorariosGrade(configClinica.horariosDisponiveis);
    }
    if (configClinica.excecoesDias) {
      setExcecoesList(configClinica.excecoesDias);
    }
  }, [configClinica]);

  const diasSemanaNomes = [
    { num: 0, nome: 'Dom', completo: 'Domingo' },
    { num: 1, nome: 'Seg', completo: 'Segunda-feira' },
    { num: 2, nome: 'Ter', completo: 'Terça-feira' },
    { num: 3, nome: 'Qua', completo: 'Quarta-feira' },
    { num: 4, nome: 'Qui', completo: 'Quinta-feira' },
    { num: 5, nome: 'Sex', completo: 'Sexta-feira' },
    { num: 6, nome: 'Sáb', completo: 'Sábado' },
  ];

  const toggleDia = (num: number) => {
    if (diasAtendimento.includes(num)) {
      if (diasAtendimento.length === 1) {
        onShowToast('Atenção', 'Selecione ao menos 1 dia da semana para atendimento.', 'error');
        return;
      }
      setDiasAtendimento(diasAtendimento.filter((d) => d !== num));
    } else {
      setDiasAtendimento([...diasAtendimento, num].sort());
    }
  };

  const handleAdicionarHorario = () => {
    if (!novoHorarioInput) return;
    if (horariosGrade.includes(novoHorarioInput)) {
      onShowToast('Aviso', 'Este horário já está cadastrado na grade.', 'info');
      return;
    }
    const updated = [...horariosGrade, novoHorarioInput].sort();
    setHorariosGrade(updated);
    setNovoHorarioInput('');
  };

  const handleRemoverHorario = (hora: string) => {
    if (horariosGrade.length === 1) {
      onShowToast('Atenção', 'Mantenha ao menos 1 horário na grade.', 'error');
      return;
    }
    setHorariosGrade(horariosGrade.filter((h) => h !== hora));
  };

  const handleGerarGradeAutomatica = () => {
    const [hIni, mIni] = geradorInicio.split(':').map(Number);
    const [hFim, mFim] = geradorFim.split(':').map(Number);
    const intervalo = parseInt(geradorIntervalo, 10) || 75;

    let minAtual = hIni * 60 + mIni;
    const minFim = hFim * 60 + mFim;

    const novos: string[] = [];
    while (minAtual <= minFim) {
      const h = Math.floor(minAtual / 60);
      const m = minAtual % 60;
      const hStr = h.toString().padStart(2, '0');
      const mStr = m.toString().padStart(2, '0');
      novos.push(`${hStr}:${mStr}`);
      minAtual += intervalo;
    }

    if (novos.length > 0) {
      setHorariosGrade(novos);
      onShowToast('Grade Gerada!', `${novos.length} horários calculados automaticamente.`, 'success');
    }
  };

  // Handlers para Exceções / Datas Específicas
  const handleAdicionarExcecao = () => {
    if (!novaExcecaoData) {
      onShowToast('Data Obrigatória', 'Selecione uma data para a configuração específica.', 'error');
      return;
    }

    if (novaExcecaoTipo === 'personalizado' && novaExcecaoHorarios.length === 0) {
      onShowToast('Horários Necessários', 'Adicione ao menos um horário para esta data ou marque como Dia Fechado.', 'error');
      return;
    }

    const novaExcecao: ExcecaoDataDisponibilidade = {
      id: `exc-${Date.now()}`,
      data: novaExcecaoData,
      tipo: novaExcecaoTipo,
      horarios: novaExcecaoTipo === 'personalizado' ? [...novaExcecaoHorarios].sort() : undefined,
      motivo: novaExcecaoMotivo.trim() || (novaExcecaoTipo === 'fechado' ? 'Agenda Fechada / Bloqueio' : 'Horários específicos'),
    };

    // Substitui se já existir para a mesma data
    const filtradas = excecoesList.filter((e) => e.data !== novaExcecaoData);
    setExcecoesList([...filtradas, novaExcecao].sort((a, b) => a.data.localeCompare(b.data)));
    
    // Reseta form
    setNovaExcecaoData('');
    setNovaExcecaoMotivo('');
    onShowToast('Exceção Adicionada!', `Configuração específica para ${formatarDataBR(novaExcecaoData)} adicionada.`, 'success');
  };

  const handleRemoverExcecao = (id: string) => {
    setExcecoesList(excecoesList.filter((e) => e.id !== id));
    onShowToast('Exceção Removida', 'A data voltará a seguir a semana padrão de trabalho.', 'info');
  };

  const handleAdicionarHorarioExcecao = () => {
    if (!novoHorarioExcecaoInput) return;
    if (novaExcecaoHorarios.includes(novoHorarioExcecaoInput)) {
      onShowToast('Aviso', 'Este horário já está na lista da exceção.', 'info');
      return;
    }
    setNovaExcecaoHorarios([...novaExcecaoHorarios, novoHorarioExcecaoInput].sort());
    setNovoHorarioExcecaoInput('');
  };

  const handleRemoverHorarioExcecao = (hora: string) => {
    setNovaExcecaoHorarios(novaExcecaoHorarios.filter((h) => h !== hora));
  };

  const handleAplicarPeriodoTardeExcecao = () => {
    setNovaExcecaoHorarios(['13:30', '14:45', '16:00', '17:15', '18:30']);
    setNovaExcecaoMotivo('Manhã fechada - Atendimento apenas à tarde');
    onShowToast('Horários da Tarde Definidos', 'Horários a partir das 13:30 preenchidos.', 'info');
  };

  const handleAplicarPeriodoManhaExcecao = () => {
    setNovaExcecaoHorarios(['08:30', '09:45', '11:00', '12:15']);
    setNovaExcecaoMotivo('Tarde fechada - Atendimento apenas pela manhã');
    onShowToast('Horários da Manhã Definidos', 'Horários das 08:30 às 12:15 preenchidos.', 'info');
  };

  const handleSalvarDisponibilidade = () => {
    const updatedClinica: ConfiguracaoClinica = {
      ...configClinica,
      diasSemanaDisponiveis: diasAtendimento,
      horariosDisponiveis: horariosGrade,
      intervaloMinutos: parseInt(geradorIntervalo, 10) || 75,
      excecoesDias: excecoesList,
    };

    if (onSalvarClinica) {
      onSalvarClinica(updatedClinica);
    }
    onShowToast('Disponibilidade Atualizada!', 'Sua semana padrão e exceções de datas foram salvas com sucesso.', 'success');
    setModalDisponibilidade(false);
  };

  // Helper para normalizar status de pagamento
  const getStatusPagamentoEfetivo = (ag: Agendamento): StatusPagamento => {
    if (ag.statusPagamento) return ag.statusPagamento;
    if (ag.status === 'concluido') return 'pago_integral';
    if (ag.status === 'sinal_pago' || ag.status === 'confirmado') return 'pago_sinal';
    return 'a_pagar';
  };

  // Filtering
  const filtered = agendamentos.filter((ag) => {
    const matchesSearch =
      ag.pacienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      ag.procedimentoNome.toLowerCase().includes(busca.toLowerCase()) ||
      ag.pacienteWhatsapp.includes(busca);

    if (!matchesSearch) return false;

    // Date
    if (filtroData === 'hoje' && ag.data !== hojeStr) return false;

    // Status Agendamento
    if (filtroStatus !== 'todos' && ag.status !== filtroStatus) return false;

    // Status Pagamento
    const stPag = getStatusPagamentoEfetivo(ag);
    if (filtroPagamento !== 'todos' && stPag !== filtroPagamento) return false;

    return true;
  });

  // Sort by date and time
  const sorted = [...filtered].sort((a, b) => {
    const dtA = `${a.data} ${a.horario}`;
    const dtB = `${b.data} ${b.horario}`;
    return dtA.localeCompare(dtB);
  });

  // KPI calculations
  const totalAgendamentos = agendamentos.length;
  const aPagarCount = agendamentos.filter((a) => getStatusPagamentoEfetivo(a) === 'a_pagar').length;
  const sinalPagoCount = agendamentos.filter((a) => getStatusPagamentoEfetivo(a) === 'pago_sinal').length;
  const pagoIntegralCount = agendamentos.filter((a) => getStatusPagamentoEfetivo(a) === 'pago_integral').length;

  const totalSinaisRecebidos = agendamentos
    .filter((a) => getStatusPagamentoEfetivo(a) === 'pago_sinal' || getStatusPagamentoEfetivo(a) === 'pago_integral')
    .reduce((acc, a) => acc + a.valorSinal, 0);

  const totalRestanteACobrar = agendamentos
    .filter((a) => getStatusPagamentoEfetivo(a) === 'pago_sinal')
    .reduce((acc, a) => acc + a.valorRestante, 0);

  const handleEnviarLembrete = (ag: Agendamento) => {
    const primeiroNome = ag.pacienteNome.split(' ')[0];
    const dataFormatada = formatarDataBR(ag.data);
    const statusPag = getStatusPagamentoEfetivo(ag);

    let infoFinanceira = '';
    if (statusPag === 'a_pagar') {
      infoFinanceira = `\n⚠️ *Cobrança:* Sinal de 50% (R$ ${ag.valorSinal.toFixed(2)}) pendente via Pix Inter para garantir seu horário.`;
    } else if (statusPag === 'pago_sinal') {
      infoFinanceira = `\n✅ *Sinal Confirmado:* R$ ${ag.valorSinal.toFixed(2)} recebido.\n💳 *Restante na Sessão:* R$ ${ag.valorRestante.toFixed(2)} (Pix, Cartão ou Dinheiro).`;
    } else {
      infoFinanceira = `\n✨ *Pagamento:* 100% Quitado Integralmente (R$ ${ag.valorTotal.toFixed(2)}).`;
    }

    const msg = `🌿 *${configClinica.nomeClinica}*
*Lembrete de Atendimento & Horário Bloqueado*

Olá, *${primeiroNome}*! Tudo bem?
Confirmamos sua sessão de *${ag.procedimentoNome}* no dia *${dataFormatada}* às *${ag.horario}h*.

📍 *Endereço:* ${configClinica.endereco} - ${configClinica.cidadeUf}${infoFinanceira}

Estamos com seu horário reservado e preparando a sala com muito carinho. Qualquer imprevisto, favor avisar com antecedência. Até logo! ✨`;

    abrirWhatsAppComTexto(ag.pacienteWhatsapp, msg);
    onShowToast('WhatsApp Aberto', 'Lembrete formatado para envio.', 'info');
  };

  const handleSyncGoogle = async (ag: Agendamento) => {
    setSyncingId(ag.id);
    try {
      await onSincronizarGoogleCalendar(ag);
    } finally {
      setSyncingId(null);
    }
  };

  // Badge de Status de Pagamento
  const getPaymentBadge = (ag: Agendamento) => {
    const st = getStatusPagamentoEfetivo(ag);

    switch (st) {
      case 'a_pagar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>🔴 A Pagar (R$ {ag.valorTotal.toFixed(2)})</span>
          </span>
        );
      case 'pago_sinal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>🟡 Sinal 50% Pago (R$ {ag.valorSinal.toFixed(2)})</span>
          </span>
        );
      case 'pago_integral':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>🟢 100% Quitado (R$ {ag.valorTotal.toFixed(2)})</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="view-agendamentos" className="space-y-4">
      {/* Top Metrics Cards - Grid Responsivo (2 colunas mobile, 4 em desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
            Total na Agenda
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{totalAgendamentos}</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Sessões registradas</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block font-mono">
            🔴 A Pagar
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-900">{aPagarCount}</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-[10px] text-rose-700 mt-0.5 truncate">Pendente de sinal ou total</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block font-mono">
            🟡 Sinal 50% Pago
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-900">{sinalPagoCount}</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[10px] text-amber-800 mt-0.5 truncate">
            R$ {totalRestanteACobrar.toFixed(2)} a receber
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block font-mono">
            🟢 100% Quitado
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-900">{pagoIntegralCount}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5 truncate">Sessões 100% quitadas</p>
        </div>
      </div>

      {/* Control Bar: Compact Search & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar paciente, serviço ou fone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Data Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            {(['hoje', 'todos'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroData(f)}
                className={`px-3 py-1.5 rounded-md transition-all touch-manipulation min-h-[34px] ${
                  filtroData === f
                    ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'hoje' ? 'Hoje' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Payment Filter Dropdown */}
          <select
            value={filtroPagamento}
            onChange={(e) => setFiltroPagamento(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px]"
          >
            <option value="todos">Todos Pagamentos</option>
            <option value="a_pagar">🔴 A Pagar</option>
            <option value="pago_sinal">🟡 Sinal 50% Pago</option>
            <option value="pago_integral">🟢 Quitado (100%)</option>
          </select>

          {/* Button Disponibilidade */}
          <button
            id="btn-ajustar-disponibilidade-agenda"
            onClick={() => setModalDisponibilidade(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all touch-manipulation min-h-[38px] shrink-0 border border-slate-200 cursor-pointer"
            title="Definir dias e horários de atendimento da terapeuta"
          >
            <Settings2 className="w-4 h-4 text-emerald-600" />
            <span>Horários & Dias</span>
          </button>

          {/* Button Novo Agendamento */}
          <button
            onClick={onOpenNovoAgendamento}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all touch-manipulation min-h-[38px] shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Horário</span>
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há agendamentos para os filtros selecionados. Crie um novo agendamento ou envie o link online aos pacientes.
          </p>
          <button
            onClick={onOpenNovoAgendamento}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all min-h-[44px] touch-manipulation shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Agendamento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sorted.map((ag) => {
            const dataFormatada = formatarDataBR(ag.data);
            const isHoje = ag.data === hojeStr;
            const statusPag = getStatusPagamentoEfetivo(ag);
            const isSyncingThis = syncingId === ag.id;

            return (
              <div
                key={ag.id}
                className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-4 shadow-xs hover:border-slate-300 ${
                  statusPag === 'a_pagar'
                    ? 'border-l-4 border-l-rose-500 border-slate-200'
                    : statusPag === 'pago_sinal'
                    ? 'border-l-4 border-l-amber-500 border-slate-200'
                    : 'border-l-4 border-l-emerald-500 border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
                  {/* Left Column: Date, Time, Patient & Payment Tag */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Time Badge */}
                    <div
                      className={`px-3 py-2 rounded-xl text-center shrink-0 border ${
                        isHoje
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-mono font-bold block leading-tight">{ag.horario}h</span>
                      <span className="text-[10px] opacity-90 block leading-tight mt-0.5">{dataFormatada}</span>
                    </div>

                    {/* Patient & Therapy info */}
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {ag.pacienteNome}
                        </h4>
                        {/* Sinalização Principal de Pagamento */}
                        {getPaymentBadge(ag)}

                        {/* Indicador de Google Calendar */}
                        {ag.googleEventId ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                            title="Horário bloqueado e sincronizado com Google Agenda"
                          >
                            <Calendar className="w-3 h-3 text-blue-600" />
                            Google Agenda Travada
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSyncGoogle(ag)}
                            disabled={isSyncingThis}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-slate-300 transition-colors touch-manipulation min-h-[26px]"
                            title="Clique para sincronizar e travar esse horário no Google Agenda"
                          >
                            {isSyncingThis ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                            ) : (
                              <Calendar className="w-3 h-3" />
                            )}
                            Sincronizar Google
                          </button>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        {ag.procedimentoNome} • <span className="text-slate-500 font-normal">{ag.duracaoMinutos} min</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <strong className="font-mono text-slate-700">{ag.pacienteWhatsapp}</strong>
                        </span>
                        {ag.observacoes && (
                          <span className="italic truncate max-w-xs text-slate-400">
                            "{ag.observacoes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Financial Breakdown (Painel de Cobrança na Hora) */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs shrink-0 justify-between lg:justify-start">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none font-mono">Total</span>
                      <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">R$ {ag.valorTotal.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-7 bg-slate-200" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block leading-none font-mono">Sinal (50%)</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">R$ {ag.valorSinal.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-7 bg-slate-200" />
                    <div className={statusPag === 'pago_sinal' ? 'bg-amber-100/80 px-2 py-1 rounded-lg' : ''}>
                      <span className="text-[9px] uppercase font-bold text-amber-900 block leading-none font-mono">
                        {statusPag === 'pago_integral' ? 'Quitado' : 'Cobrar na Hora'}
                      </span>
                      <span className="font-mono font-bold text-amber-950 text-xs sm:text-sm">
                        {statusPag === 'pago_integral' ? 'R$ 0,00' : `R$ ${ag.valorRestante.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions com Touch Targets Confortáveis */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Ações de Cobrança / Pagamento Conforme o Status */}
                    {statusPag === 'a_pagar' && (
                      <>
                        <button
                          id={`btn-pix-ag-${ag.id}`}
                          onClick={() => onOpenPixModal(ag)}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs touch-manipulation min-h-[40px]"
                          title="Gerar / Ver Cobrança Pix Inter para o Sinal"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Cobrar Pix 50%</span>
                        </button>

                        <button
                          onClick={() => onConfirmarSinal(ag.id, 'pix_inter')}
                          className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation min-h-[40px]"
                          title="Marcar que o cliente já transferiu o sinal de 50%"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Confirmar 50%</span>
                        </button>
                      </>
                    )}

                    {statusPag === 'pago_sinal' && (
                      <button
                        id={`btn-concluir-ag-${ag.id}`}
                        onClick={() => onReceberRestanteEConcluir(ag)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs touch-manipulation min-h-[40px]"
                        title="Receber os 50% restantes e concluir o atendimento"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Receber R$ {ag.valorRestante.toFixed(2)} (Quitar)</span>
                      </button>
                    )}

                    {statusPag === 'pago_integral' && ag.status !== 'concluido' && (
                      <button
                        onClick={() => onReceberRestanteEConcluir(ag)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs touch-manipulation min-h-[40px]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Concluir Sessão</span>
                      </button>
                    )}

                    {/* Botão de Evolução Clínica */}
                    <button
                      id={`btn-evolucao-ag-${ag.id}`}
                      onClick={() => onIniciarEvolucao(ag)}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs touch-manipulation min-h-[40px]"
                      title="Registrar nota de evolução e relatório em PDF"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Evolução</span>
                    </button>

                    {/* Lembrete WhatsApp */}
                    <button
                      onClick={() => handleEnviarLembrete(ag)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Enviar Lembrete de Horário no WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => onExcluirAgendamento(ag.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Excluir Agendamento"
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

      {/* Modal de Configuração de Horários & Dias Disponíveis da Terapeuta */}
      {modalDisponibilidade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 font-mono">
                    Grade de Atendimento
                  </span>
                  <h3 className="font-bold text-base">Ajustar Dias & Horários Disponíveis</h3>
                </div>
              </div>
              <button
                onClick={() => setModalDisponibilidade(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tabs de Navegação no Modal */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setAbaDisponibilidade('semana')}
                className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  abaDisponibilidade === 'semana'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>1. Semana Padrão de Trabalho</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaDisponibilidade('excecoes')}
                className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  abaDisponibilidade === 'excecoes'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CalendarOff className="w-3.5 h-3.5" />
                <span>2. Datas Específicas / Exceções ({excecoesList.length})</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* ABA 1: SEMANA PADRÃO */}
              {abaDisponibilidade === 'semana' && (
                <div className="space-y-4">
                  {/* 1. Dias da Semana */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Dias da Semana de Atendimento Regular:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Defina os dias da semana em que você normalmente atende na clínica.
                    </p>
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {diasSemanaNomes.map((d) => {
                        const isAtivo = diasAtendimento.includes(d.num);
                        return (
                          <button
                            key={d.num}
                            type="button"
                            onClick={() => toggleDia(d.num)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                              isAtivo
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={d.completo}
                          >
                            <span className="text-[11px]">{d.nome}</span>
                            {isAtivo && <Check className="w-3 h-3 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Grade de Horários Atuais */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 block text-xs">
                        Grade Regular de Horários ({horariosGrade.length} vagas):
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      {horariosGrade.map((hora) => (
                        <span
                          key={hora}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs group"
                        >
                          {hora}
                          <button
                            type="button"
                            onClick={() => handleRemoverHorario(hora)}
                            className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                            title="Remover horário"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Adicionar horário avulso */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="time"
                        value={novoHorarioInput}
                        onChange={(e) => setNovoHorarioInput(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarHorario}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Horário</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Gerador Automático de Grade */}
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5">
                    <span className="font-bold text-emerald-950 block text-[11px] uppercase tracking-wider">
                      ⚡ Gerador Rápido de Grade por Intervalo:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-900 block mb-0.5">Início:</span>
                        <input
                          type="time"
                          value={geradorInicio}
                          onChange={(e) => setGeradorInicio(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-xs font-mono bg-white text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-900 block mb-0.5">Término:</span>
                        <input
                          type="time"
                          value={geradorFim}
                          onChange={(e) => setGeradorFim(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-xs font-mono bg-white text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-900 block mb-0.5">Intervalo:</span>
                        <select
                          value={geradorIntervalo}
                          onChange={(e) => setGeradorIntervalo(e.target.value)}
                          className="w-full px-1.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-mono bg-white text-center"
                        >
                          <option value="45">45 min</option>
                          <option value="60">60 min</option>
                          <option value="75">75 min (Padrão)</option>
                          <option value="90">90 min</option>
                          <option value="120">120 min</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGerarGradeAutomatica}
                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      Recalcular e Gerar Grade de Horários
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 2: DATAS ESPECÍFICAS / EXCEÇÕES */}
              {abaDisponibilidade === 'excecoes' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      💡 <strong>Configuração Específica por Data:</strong> Permite alterar a disponibilidade de um dia específico (ex: fechar a manhã e atender só à tarde, bloquear o dia inteiro para curso/folga, ou abrir um horário extraordinário).
                    </p>
                  </div>

                  {/* Form Nova Exceção */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                      + Criar Nova Configuração de Data:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Data Específica:
                        </label>
                        <input
                          type="date"
                          value={novaExcecaoData}
                          onChange={(e) => setNovaExcecaoData(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Tipo de Disponibilidade:
                        </label>
                        <select
                          value={novaExcecaoTipo}
                          onChange={(e) => setNovaExcecaoTipo(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none font-semibold text-slate-800"
                        >
                          <option value="personalizado">🕒 Horários Personalizados (ex: Apenas à Tarde)</option>
                          <option value="fechado">🚫 Dia Totalmente Fechado / Bloqueado</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Motivo / Descrição (visível para organização):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Manhã fechada - Curso de capacitação / Atendimento somente à tarde"
                        value={novaExcecaoMotivo}
                        onChange={(e) => setNovaExcecaoMotivo(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Se for personalizado: Configuração de Horários */}
                    {novaExcecaoTipo === 'personalizado' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <label className="text-[11px] font-bold text-slate-800">
                            Horários Disponíveis nesta data ({novaExcecaoHorarios.length} horários):
                          </label>

                          {/* Botões de Preenchimento Rápido */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleAplicarPeriodoTardeExcecao}
                              className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold cursor-pointer"
                            >
                              ☀️ Só à Tarde (13:30+)
                            </button>
                            <button
                              type="button"
                              onClick={handleAplicarPeriodoManhaExcecao}
                              className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded text-[10px] font-bold cursor-pointer"
                            >
                              🌅 Só pela Manhã
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-200 min-h-[40px]">
                          {novaExcecaoHorarios.map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-200 font-mono text-xs font-bold"
                            >
                              {h}
                              <button
                                type="button"
                                onClick={() => handleRemoverHorarioExcecao(h)}
                                className="text-blue-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          {novaExcecaoHorarios.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">Nenhum horário adicionado</span>
                          )}
                        </div>

                        {/* Adicionar horário à exceção */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <input
                            type="time"
                            value={novoHorarioExcecaoInput}
                            onChange={(e) => setNovoHorarioExcecaoInput(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAdicionarHorarioExcecao}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar Horário na Data</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAdicionarExcecao}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Salvar Configuração para esta Data</span>
                    </button>
                  </div>

                  {/* Lista de Exceções Cadastradas */}
                  <div className="space-y-2 pt-2">
                    <label className="font-bold text-slate-900 block text-xs">
                      Exceções & Bloqueios Salvos ({excecoesList.length}):
                    </label>

                    {excecoesList.length === 0 && (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                        Nenhuma exceção cadastrada. Todos os dias seguem a Semana Padrão de Trabalho.
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {excecoesList.map((exc) => (
                        <div
                          key={exc.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                            exc.tipo === 'fechado'
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : 'bg-blue-50/70 border-blue-200 text-blue-950'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold font-mono text-xs">
                                {formatarDataBR(exc.data)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  exc.tipo === 'fechado'
                                    ? 'bg-rose-200 text-rose-800'
                                    : 'bg-blue-200 text-blue-800'
                                }`}
                              >
                                {exc.tipo === 'fechado' ? '🚫 Totalmente Fechado' : '🕒 Horários Especiais'}
                              </span>
                            </div>

                            <p className="text-[11px] font-medium opacity-90">{exc.motivo}</p>

                            {exc.tipo === 'personalizado' && exc.horarios && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {exc.horarios.map((h) => (
                                  <span
                                    key={h}
                                    className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-[10px] font-mono font-bold text-blue-900"
                                  >
                                    {h}h
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoverExcecao(exc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Remover exceção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalDisponibilidade(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarDisponibilidade}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Disponibilidade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
