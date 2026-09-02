import React, { useState } from 'react';
import { Sparkles, Plus, Clock, DollarSign, Edit2, Trash2, CheckCircle2, Package, Layers, CreditCard, ExternalLink, Link2 } from 'lucide-react';
import { Procedimento, ProcedimentoCategoria } from '../types';

interface ProcedimentosViewProps {
  procedimentos: Procedimento[];
  onSalvarProcedimento: (procedimento: Procedimento) => void;
  onExcluirProcedimento: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProcedimentosView: React.FC<ProcedimentosViewProps> = ({
  procedimentos,
  onSalvarProcedimento,
  onExcluirProcedimento,
  onShowToast,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Procedimento | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<ProcedimentoCategoria>('massoterapia');
  const [tipo, setTipo] = useState<'avulso' | 'pacote'>('avulso');
  const [quantidadeSessoes, setQuantidadeSessoes] = useState('8');
  const [duracaoMinutos, setDuracaoMinutos] = useState('60');
  const [precoTotal, setPrecoTotal] = useState('160');
  const [sinalPercentual, setSinalPercentual] = useState('50');
  const [linkPagamentoCartao, setLinkPagamentoCartao] = useState('https://link.infinitepay.io/caroline-padela');
  const [descricao, setDescricao] = useState('');
  const [corTag, setCorTag] = useState('#10b981');

  const abrirModal = (proc?: Procedimento) => {
    if (proc) {
      setEditando(proc);
      setNome(proc.nome);
      setCategoria(proc.categoria);
      setTipo(proc.tipo || 'avulso');
      setQuantidadeSessoes(proc.quantidadeSessoes?.toString() || (proc.tipo === 'pacote' ? '8' : '1'));
      setDuracaoMinutos(proc.duracaoMinutos.toString());
      setPrecoTotal(proc.precoTotal.toString());
      setSinalPercentual(proc.sinalPercentual.toString());
      setLinkPagamentoCartao(proc.linkPagamentoCartao || 'https://link.infinitepay.io/caroline-padela');
      setDescricao(proc.descricao);
      setCorTag(proc.corTag || '#10b981');
    } else {
      setEditando(null);
      setNome('');
      setCategoria('massoterapia');
      setTipo('avulso');
      setQuantidadeSessoes('8');
      setDuracaoMinutos('60');
      setPrecoTotal('160');
      setSinalPercentual('50');
      setLinkPagamentoCartao('https://link.infinitepay.io/caroline-padela');
      setDescricao('');
      setCorTag('#10b981');
    }
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(precoTotal);
    const perc = parseFloat(sinalPercentual) || 50;
    const dur = parseInt(duracaoMinutos, 10) || 60;
    const qtdSessoes = tipo === 'pacote' ? Math.max(2, parseInt(quantidadeSessoes, 10) || 8) : 1;

    if (!nome.trim() || isNaN(preco) || preco <= 0) {
      onShowToast('Atenção', 'Preencha o nome e preço válidos.', 'error');
      return;
    }

    const valorSinal = (preco * perc) / 100;

    const item: Procedimento = {
      id: editando ? editando.id : `proc-${Date.now()}`,
      nome,
      categoria,
      tipo,
      quantidadeSessoes: qtdSessoes,
      duracaoMinutos: dur,
      precoTotal: preco,
      sinalPercentual: perc,
      valorSinal,
      linkPagamentoCartao: linkPagamentoCartao.trim() || undefined,
      descricao,
      corTag,
      ativo: true,
    };

    onSalvarProcedimento(item);
    onShowToast('Procedimento Salvo', `${nome} (${tipo === 'pacote' ? `Pacote com ${qtdSessoes} sessões` : 'Sessão Avulsa'})`, 'success');
    setModalAberto(false);
  };

  return (
    <div id="view-procedimentos" className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Catálogo de Procedimentos & Pacotes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre sessões avulsas ou pacotes fechados de tratamento (4, 8, 10 sessões) com controle automático no financeiro.
          </p>
        </div>

        <button
          id="btn-novo-procedimento"
          onClick={() => abrirModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Procedimento</span>
        </button>
      </div>

      {/* Grid of Procedure cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {procedimentos.map((proc) => {
          const isPacote = proc.tipo === 'pacote' || (proc.quantidadeSessoes && proc.quantidadeSessoes > 1);
          const qtd = proc.quantidadeSessoes || (isPacote ? 8 : 1);

          return (
            <div
              key={proc.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between ${
                isPacote ? 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/10' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {proc.categoria}
                    </span>
                    {isPacote ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                        <Package className="w-3 h-3 text-indigo-600" />
                        Pacote ({qtd} sessões)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sessão Avulsa
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {proc.duracaoMinutos} min
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{proc.nome}</h3>
                <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                  {proc.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                {/* Financial Box */}
                <div className={`border rounded-xl p-2.5 flex items-center justify-between text-xs ${
                  isPacote ? 'bg-indigo-50/70 border-indigo-100' : 'bg-emerald-50/60 border-emerald-100'
                }`}>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">
                      {isPacote ? `Valor Total (${qtd}x)` : 'Total da Sessão'}
                    </span>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      R$ {proc.precoTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-800 block text-[9px] uppercase font-bold">
                      Sinal 50% Pix
                    </span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      R$ {proc.valorSinal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Link de Cartão InfinitePay do Procedimento */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] font-bold text-slate-500 block uppercase">Link Cartão (100%)</span>
                      <span className="font-mono text-slate-700 text-[10px] truncate block">
                        {proc.linkPagamentoCartao ? proc.linkPagamentoCartao.replace('https://', '') : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  {proc.linkPagamentoCartao ? (
                    <a
                      href={proc.linkPagamentoCartao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Testar link de pagamento no navegador"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>Testar</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirModal(proc)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold shrink-0"
                    >
                      + Inserir
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => abrirModal(proc)}
                    className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onExcluirProcedimento(proc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir procedimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo/Editar Procedimento */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 font-mono">
                  {tipo === 'pacote' ? 'Pacote de Sessões' : 'Sessão Avulsa'}
                </span>
                <h3 className="font-bold text-base">
                  {editando ? 'Editar Procedimento' : 'Novo Procedimento / Pacote'}
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
              {/* Tipo: Sessão Avulsa vs Pacote */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Tipo de Procedimento *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('avulso')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tipo === 'avulso'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Sessão Avulsa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo('pacote')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tipo === 'pacote'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Pacote de Sessões</span>
                  </button>
                </div>
              </div>

              {/* Se for pacote: Quantidade de sessões */}
              {tipo === 'pacote' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-700" />
                      Quantidade de Sessões no Pacote *
                    </label>
                    <span className="text-[11px] font-mono font-bold text-indigo-700">
                      {quantidadeSessoes} sessões
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[4, 6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantidadeSessoes(num.toString())}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          quantidadeSessoes === num.toString()
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                    <input
                      type="number"
                      min="2"
                      max="100"
                      required
                      value={quantidadeSessoes}
                      onChange={(e) => setQuantidadeSessoes(e.target.value)}
                      placeholder="Outro"
                      className="w-16 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-mono font-bold bg-white text-center"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-800">
                    Ao agendar este pacote, ele entrará automaticamente na aba de <strong>Controle de Pacotes</strong> com controle de sessões realizadas.
                  </p>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder={tipo === 'pacote' ? 'Ex: Pacote Alívio da Dor (8 Sessões)' : 'Ex: Massagem Terapêutica & Liberação'}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="massoterapia">Massoterapia</option>
                    <option value="fisioterapia">Fisioterapia</option>
                    <option value="terapia_manual">Terapia Manual</option>
                    <option value="estetica">Estética Corporal</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duração por Sessão (Min)</label>
                  <input
                    type="number"
                    required
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {tipo === 'pacote' ? 'Valor Total do Pacote (R$) *' : 'Preço Total da Sessão (R$) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="180.00"
                    value={precoTotal}
                    onChange={(e) => setPrecoTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-850 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sinal de Reserva (%)</label>
                  <input
                    type="number"
                    required
                    value={sinalPercentual}
                    onChange={(e) => setSinalPercentual(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold text-emerald-700 font-mono"
                  />
                </div>
              </div>

              {/* Preview signal */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                <span>Sinal cobrado no Pix (50%):</span>
                <strong className="text-sm font-mono">
                  R$ {((parseFloat(precoTotal) || 0) * ((parseFloat(sinalPercentual) || 50) / 100)).toFixed(2)}
                </strong>
              </div>

              {/* Link de Pagamento no Cartão de Crédito (Link Fixo) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Link de Pagamento Cartão de Crédito (Link Fixo InfinitePay)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">100% do Valor</span>
                </div>
                
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="Ex: https://link.infinitepay.io/caroline-padela/nome-servico"
                    value={linkPagamentoCartao}
                    onChange={(e) => setLinkPagamentoCartao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {linkPagamentoCartao && (
                    <a
                      href={linkPagamentoCartao.startsWith('http') ? linkPagamentoCartao : `https://${linkPagamentoCartao}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                      title="Abrir e testar este link no navegador"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Testar</span>
                    </a>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Gere a cobrança com o valor total deste serviço/pacote no app da sua maquininha (InfinitePay) e cole o link aqui. Ao agendar no cartão, o paciente acessa este link direto.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição / Benefícios</label>
                <textarea
                  rows={3}
                  placeholder="Explique os benefícios terapêuticos para o cliente ver no link de agendamento..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

