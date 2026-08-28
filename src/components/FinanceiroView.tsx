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
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  ConfiguracaoInter,
  TransacaoFinanceira,
  TipoTransacao,
} from '../types';

interface FinanceiroViewProps {
  transacoes: TransacaoFinanceira[];
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  onNovaTransacao: (transacao: TransacaoFinanceira) => void;
  onExcluirTransacao: (transacaoId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  transacoes,
  configClinica,
  configInter,
  onNovaTransacao,
  onExcluirTransacao,
  onShowToast,
}) => {
  const [periodo, setPeriodo] = useState<'esta_semana' | 'semana_passada' | 'este_mes' | 'todos'>('esta_semana');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [modalNovo, setModalNovo] = useState(false);

  // Form states
  const [formTipo, setFormTipo] = useState<'receita' | 'despesa'>('receita');
  const [formCategoria, setFormCategoria] = useState<TipoTransacao>('receita_sinal');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formFormaPagto, setFormFormaPagto] = useState<TransacaoFinanceira['formaPagamento']>('pix_inter');

  // Helpers for week calculation
  const { inicioSemana, fimSemana, inicioSemanaPassada, fimSemanaPassada, inicioMes } = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;

    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() + diffToMonday);
    startThisWeek.setHours(0, 0, 0, 0);

    const endThisWeek = new Date(startThisWeek);
    endThisWeek.setDate(startThisWeek.getDate() + 6);
    endThisWeek.setHours(23, 59, 59, 999);

    const startLastWeek = new Date(startThisWeek);
    startLastWeek.setDate(startThisWeek.getDate() - 7);

    const endLastWeek = new Date(startThisWeek);
    endLastWeek.setDate(startThisWeek.getDate() - 1);

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const toStr = (d: Date) => d.toISOString().split('T')[0];

    return {
      inicioSemana: toStr(startThisWeek),
      fimSemana: toStr(endThisWeek),
      inicioSemanaPassada: toStr(startLastWeek),
      fimSemanaPassada: toStr(endLastWeek),
      inicioMes: toStr(startMonth),
    };
  }, []);

  // Filter transactions
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      // Type filter
      if (tipoFiltro !== 'todos' && t.tipo !== tipoFiltro) return false;

      // Period filter
      if (periodo === 'esta_semana') {
        return t.data >= inicioSemana && t.data <= fimSemana;
      }
      if (periodo === 'semana_passada') {
        return t.data >= inicioSemanaPassada && t.data <= fimSemanaPassada;
      }
      if (periodo === 'este_mes') {
        return t.data >= inicioMes;
      }
      return true;
    });
  }, [transacoes, tipoFiltro, periodo, inicioSemana, fimSemana, inicioSemanaPassada, fimSemanaPassada, inicioMes]);

  // Sort by date desc
  const sorted = useMemo(() => {
    return [...transacoesFiltradas].sort((a, b) => b.data.localeCompare(a.data));
  }, [transacoesFiltradas]);

  // Financial Metrics
  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const lucroLiquido = totalReceitas - totalDespesas;
  const margemLucro = totalReceitas > 0 ? Math.round((lucroLiquido / totalReceitas) * 100) : 0;

  const totalSinaisInter = transacoesFiltradas
    .filter((t) => t.categoria === 'receita_sinal')
    .reduce((acc, t) => acc + t.valor, 0);

  // Group by day for weekly breakdown
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const diasStats = useMemo(() => {
    // 7 days
    const map = [
      { dia: 'Seg', rec: 0, desp: 0 },
      { dia: 'Ter', rec: 0, desp: 0 },
      { dia: 'Qua', rec: 0, desp: 0 },
      { dia: 'Qui', rec: 0, desp: 0 },
      { dia: 'Sex', rec: 0, desp: 0 },
      { dia: 'Sáb', rec: 0, desp: 0 },
      { dia: 'Dom', rec: 0, desp: 0 },
    ];

    transacoesFiltradas.forEach((t) => {
      const dt = new Date(t.data + 'T12:00:00Z');
      let dayIdx = dt.getDay(); // 0 is Sun
      let mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1; // 0=Seg, 6=Dom
      if (mappedIdx >= 0 && mappedIdx < 7) {
        if (t.tipo === 'receita') map[mappedIdx].rec += t.valor;
        else map[mappedIdx].desp += t.valor;
      }
    });

    return map;
  }, [transacoesFiltradas]);

  const maxDailyVal = Math.max(...diasStats.map((d) => Math.max(d.rec, d.desp)), 100);

  // Handle new transaction form
  const handleSalvarTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValor);
    if (isNaN(val) || val <= 0 || !formDescricao.trim()) {
      onShowToast('Atenção', 'Informe descrição e valor válidos.', 'error');
      return;
    }

    const nova: TransacaoFinanceira = {
      id: `fin-${Date.now()}`,
      tipo: formTipo,
      categoria: formCategoria,
      descricao: formDescricao,
      valor: val,
      data: formData,
      formaPagamento: formFormaPagto,
      status: 'confirmado',
      comprovanteRef: formFormaPagto === 'pix_inter' ? `INTER-PIX-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      criadoEm: new Date().toISOString(),
    };

    onNovaTransacao(nova);
    onShowToast('Lançamento Registrado!', `${formTipo === 'receita' ? '+' : '-'} R$ ${val.toFixed(2)}`, 'success');
    setModalNovo(false);
    setFormDescricao('');
    setFormValor('');
  };

  const handleImprimirRelatorio = () => {
    window.print();
  };

  return (
    <div id="view-financeiro" className="space-y-3.5">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Controle Financeiro & Relatórios Semanais
            </h2>
            <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
              Banco Inter Pix
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sinais de 50% recebidos, faturamento de sessões e custos operacionais do consultório.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-imprimir-relatorio-semanal"
            onClick={handleImprimirRelatorio}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold border border-slate-200 transition-colors"
            title="Imprimir ou salvar relatório consolidado em PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Imprimir Relatório</span>
            <span className="sm:hidden">Imprimir</span>
          </button>

          <button
            id="btn-novo-lancamento-financeiro"
            onClick={() => setModalNovo(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Period Filter Buttons */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Período:
          </span>
          {[
            { id: 'esta_semana', label: 'Esta Semana' },
            { id: 'semana_passada', label: 'Semana Passada' },
            { id: 'este_mes', label: 'Este Mês' },
            { id: 'todos', label: 'Todo o Período' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                periodo === p.id
                  ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md">
          <button
            onClick={() => setTipoFiltro('todos')}
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              tipoFiltro === 'todos' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTipoFiltro('receita')}
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              tipoFiltro === 'receita' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-500'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setTipoFiltro('despesa')}
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              tipoFiltro === 'despesa' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-500'
            }`}
          >
            Custos
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Faturamento Total */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
              R$ {totalReceitas.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium">
            R$ {totalSinaisInter.toFixed(2)} em sinais 50% Pix Inter
          </p>
        </div>

        {/* Custos Totais */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Custos & Despesas
            </span>
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-700">
              R$ {totalDespesas.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Insumos, descartáveis e lavanderia
          </p>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-2xs space-y-1 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Lucro Líquido Real
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-800 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-300">
              R$ {lucroLiquido.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">
            Margem Líquida: <strong>{margemLucro}%</strong>
          </p>
        </div>

        {/* Banco Inter Summary */}
        <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
              Pix Banco Inter
            </span>
            <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-mono">
              Ativo
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-950">
              {transacoesFiltradas.filter((t) => t.formaPagamento === 'pix_inter').length}
            </span>
            <span className="text-[11px] font-medium text-amber-800">transações</span>
          </div>
          <p className="text-[10px] text-amber-800 truncate font-mono">
            Chave: {configInter.chavePix}
          </p>
        </div>
      </div>

      {/* Weekly Visual Chart & Categories Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 8 cols: Weekly Bar Comparison */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                Comparativo Diário da Semana (Entradas vs Custos)
              </h3>
              <p className="text-[11px] text-slate-500">Distribuição dia a dia do consultório</p>
            </div>

            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2 h-2 bg-emerald-600 rounded-xs inline-block" /> Entradas
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="w-2 h-2 bg-rose-500 rounded-xs inline-block" /> Custos
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 pt-4 flex items-end justify-between gap-2 sm:gap-3 border-b border-slate-200 pb-1.5">
            {diasStats.map((d, i) => {
              const recHeight = (d.rec / maxDailyVal) * 100;
              const despHeight = (d.desp / maxDailyVal) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Receita bar */}
                    <div
                      style={{ height: `${Math.max(recHeight, 4)}%` }}
                      className="w-1/2 max-w-[24px] bg-emerald-600 hover:bg-emerald-700 rounded-t-xs transition-all relative group"
                    >
                      {d.rec > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                          R$ {d.rec.toFixed(0)}
                        </div>
                      )}
                    </div>

                    {/* Despesa bar */}
                    <div
                      style={{ height: `${Math.max(despHeight, 4)}%` }}
                      className="w-1/2 max-w-[24px] bg-rose-400 hover:bg-rose-500 rounded-t-xs transition-all relative group"
                    >
                      {d.desp > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                          R$ {d.desp.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">{d.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 cols: Expense & Revenue Categories Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-600" />
            Categorias de Insumos & Custos
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 space-y-0.5">
              <div className="flex justify-between font-semibold text-slate-800 text-xs">
                <span>Insumos & Óleos Essenciais</span>
                <span className="font-mono">R$ {transacoesFiltradas.filter((t) => t.categoria === 'despesa_insumos').reduce((a, b) => a + b.valor, 0).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-500">Óleos vegetais, cremes e descartáveis</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 space-y-0.5">
              <div className="flex justify-between font-semibold text-slate-800 text-xs">
                <span>Lavanderia & Higienização</span>
                <span className="font-mono">R$ {transacoesFiltradas.filter((t) => t.categoria === 'despesa_taxas').reduce((a, b) => a + b.valor, 0).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-500">Higienização e lavagem de toalhas</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 space-y-0.5">
              <div className="flex justify-between font-semibold text-slate-800 text-xs">
                <span>Custos Fixos & Internet</span>
                <span className="font-mono">R$ {transacoesFiltradas.filter((t) => t.categoria === 'despesa_fixa').reduce((a, b) => a + b.valor, 0).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-500">Consultório e utilidades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
              Livro Caixa & Lançamentos Detalhados ({sorted.length})
            </h3>
            <p className="text-[10px] text-slate-500">Histórico de todas as movimentações</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Forma de Pagamento</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((t) => {
                const dataFormatada = new Date(t.data + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const isReceita = t.tipo === 'receita';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap font-mono">
                      {dataFormatada}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isReceita ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ArrowUpRight className="w-3 h-3" /> Receita
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <ArrowDownRight className="w-3 h-3" /> Custo
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <div>{t.descricao}</div>
                      {t.comprovanteRef && (
                        <span className="text-[9px] font-mono text-slate-400">{t.comprovanteRef}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {t.formaPagamento === 'pix_inter' && '🔑 Pix Banco Inter'}
                        {t.formaPagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                        {t.formaPagamento === 'dinheiro' && '💵 Dinheiro'}
                        {t.formaPagamento === 'boleto' && '📄 Boleto'}
                        {t.formaPagamento === 'transferencia' && '🏦 Transferência'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono text-xs ${
                          isReceita ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isReceita ? '+' : '-'} R$ {t.valor.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onExcluirTransacao(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Lançamento */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Novo Lançamento Financeiro</h3>
              <button
                onClick={() => setModalNovo(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao} className="p-6 space-y-4 text-xs">
              {/* Tipo Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormTipo('receita');
                    setFormCategoria('receita_sinal');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                    formTipo === 'receita'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  + Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormTipo('despesa');
                    setFormCategoria('despesa_insumos');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                    formTipo === 'despesa'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  - Saída (Custo/Despesa)
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    formTipo === 'receita'
                      ? 'Ex: Sinal 50% Pix Inter - Nome do Paciente'
                      : 'Ex: Óleos essenciais Lavanda / Descartáveis'
                  }
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data</label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Categoria</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  {formTipo === 'receita' ? (
                    <>
                      <option value="receita_sinal">Sinal de 50% (Garantia Agendamento Pix)</option>
                      <option value="receita_restante">Quitação Restante 50% (Pós-Atendimento)</option>
                      <option value="receita_avulsa">Pacote de Sessões / Procedimento Avulso</option>
                    </>
                  ) : (
                    <>
                      <option value="despesa_insumos">Insumos (Óleos, Cremes, Descartáveis, Toalhas)</option>
                      <option value="despesa_fixa">Custos Fixos (Aluguel, Luz, Internet, Software)</option>
                      <option value="despesa_taxas">Lavanderia / Taxas Bancárias Inter</option>
                      <option value="despesa_outros">Outras Despesas</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Forma de Pagamento</label>
                <select
                  value={formFormaPagto}
                  onChange={(e) => setFormFormaPagto(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="pix_inter">🔑 Pix Banco Inter</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="dinheiro">💵 Dinheiro Presencial</option>
                  <option value="boleto">📄 Boleto Bancário</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
