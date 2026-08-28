import React, { useState } from 'react';
import { Sparkles, Plus, Clock, DollarSign, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
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
  const [duracaoMinutos, setDuracaoMinutos] = useState('60');
  const [precoTotal, setPrecoTotal] = useState('160');
  const [sinalPercentual, setSinalPercentual] = useState('50');
  const [descricao, setDescricao] = useState('');
  const [corTag, setCorTag] = useState('#10b981');

  const abrirModal = (proc?: Procedimento) => {
    if (proc) {
      setEditando(proc);
      setNome(proc.nome);
      setCategoria(proc.categoria);
      setDuracaoMinutos(proc.duracaoMinutos.toString());
      setPrecoTotal(proc.precoTotal.toString());
      setSinalPercentual(proc.sinalPercentual.toString());
      setDescricao(proc.descricao);
      setCorTag(proc.corTag || '#10b981');
    } else {
      setEditando(null);
      setNome('');
      setCategoria('massoterapia');
      setDuracaoMinutos('60');
      setPrecoTotal('160');
      setSinalPercentual('50');
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

    if (!nome.trim() || isNaN(preco) || preco <= 0) {
      onShowToast('Atenção', 'Preencha o nome e preço válidos.', 'error');
      return;
    }

    const valorSinal = (preco * perc) / 100;

    const item: Procedimento = {
      id: editando ? editando.id : `proc-${Date.now()}`,
      nome,
      categoria,
      duracaoMinutos: dur,
      precoTotal: preco,
      sinalPercentual: perc,
      valorSinal,
      descricao,
      corTag,
      ativo: true,
    };

    onSalvarProcedimento(item);
    onShowToast('Procedimento Salvo', nome, 'success');
    setModalAberto(false);
  };

  return (
    <div id="view-procedimentos" className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Catálogo de Procedimentos & Terapias
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Massagens, drenagens e sessões de fisioterapia com valor total e cálculo automático do sinal de 50%.
          </p>
        </div>

        <button
          id="btn-novo-procedimento"
          onClick={() => abrirModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Procedimento</span>
        </button>
      </div>

      {/* Grid of Procedure cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {procedimentos.map((proc) => (
          <div
            key={proc.id}
            className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs space-y-2.5 hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {proc.categoria}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  {proc.duracaoMinutos} min
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900">{proc.nome}</h3>
              <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                {proc.descricao || 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              {/* Financial Box */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-2 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Total da Sessão</span>
                  <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm">
                    R$ {proc.precoTotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-800 block text-[9px] uppercase font-bold">
                    Sinal 50% Pix Inter
                  </span>
                  <span className="font-bold font-mono text-emerald-700 text-xs sm:text-sm">
                    R$ {proc.valorSinal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => abrirModal(proc)}
                  className="p-1 px-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onExcluirProcedimento(proc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Excluir procedimento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo/Editar Procedimento */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editando ? 'Editar Procedimento' : 'Novo Procedimento / Terapia'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Massagem Terapêutica & Liberação Miofascial"
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
                  <label className="font-semibold text-slate-700 block mb-1">Duração (Minutos)</label>
                  <input
                    type="number"
                    required
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Preço Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="180.00"
                    value={precoTotal}
                    onChange={(e) => setPrecoTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-850"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sinal de Reserva (%)</label>
                  <input
                    type="number"
                    required
                    value={sinalPercentual}
                    onChange={(e) => setSinalPercentual(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold text-emerald-700"
                  />
                </div>
              </div>

              {/* Preview 50% signal */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                <span>Sinal gerado no agendamento:</span>
                <strong className="text-sm">
                  R$ {((parseFloat(precoTotal) || 0) * ((parseFloat(sinalPercentual) || 50) / 100)).toFixed(2)}
                </strong>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs"
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
