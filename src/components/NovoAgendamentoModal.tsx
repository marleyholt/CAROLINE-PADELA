import React, { useState } from 'react';
import { X, Calendar, Clock, User, Sparkles, QrCode, DollarSign } from 'lucide-react';
import { Agendamento, Paciente, Procedimento, StatusPagamento } from '../types';

interface NovoAgendamentoModalProps {
  isOpen?: boolean;
  pacientes: Paciente[];
  procedimentos: Procedimento[];
  configInter?: any;
  onClose: () => void;
  onSalvar?: (agendamento: Agendamento, abrirPixImediato: boolean) => void;
  onCriarAgendamento?: (agendamento: Agendamento, abrirPixImediato: boolean) => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const NovoAgendamentoModal: React.FC<NovoAgendamentoModalProps> = ({
  pacientes,
  procedimentos,
  onClose,
  onSalvar,
  onCriarAgendamento,
}) => {
  const hoje = new Date().toISOString().split('T')[0];
  const [pacienteId, setPacienteId] = useState<string>(pacientes[0]?.id || 'novo');
  const [novoNome, setNovoNome] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  
  const [procedimentoId, setProcedimentoId] = useState<string>(procedimentos[0]?.id || '');
  const [data, setData] = useState<string>(hoje);
  const [horario, setHorario] = useState<string>('14:00');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('a_pagar');
  const [observacoes, setObservacoes] = useState('');

  const procSelecionado = procedimentos.find((p) => p.id === procedimentoId) || procedimentos[0];
  const precoTotal = procSelecionado ? procSelecionado.precoTotal : 160;
  const valorSinal = procSelecionado ? procSelecionado.valorSinal : 80;
  const valorRestante = precoTotal - valorSinal;

  const handleSubmit = (abrirPix: boolean) => {
    let finalPacNome = '';
    let finalPacWhats = '';
    let finalPacEmail = '';
    let finalPacId = pacienteId;

    if (pacienteId === 'novo') {
      finalPacNome = novoNome || 'Novo Paciente';
      finalPacWhats = novoWhatsapp || '11999999999';
      finalPacEmail = novoEmail;
      finalPacId = `pac-${Date.now()}`;
    } else {
      const pac = pacientes.find((p) => p.id === pacienteId);
      finalPacNome = pac?.nome || 'Paciente';
      finalPacWhats = pac?.whatsapp || '';
      finalPacEmail = pac?.email || '';
    }

    const isSinalPago = statusPagamento === 'pago_sinal';
    const isIntegral = statusPagamento === 'pago_integral';

    const novoAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      pacienteId: finalPacId,
      pacienteNome: finalPacNome,
      pacienteWhatsapp: finalPacWhats,
      pacienteEmail: finalPacEmail,
      procedimentoId: procSelecionado.id,
      procedimentoNome: procSelecionado.nome,
      data,
      horario,
      duracaoMinutos: procSelecionado.duracaoMinutos,
      valorTotal: precoTotal,
      valorSinal,
      valorRestante,
      status: isIntegral ? 'confirmado' : isSinalPago ? 'sinal_pago' : 'aguardando_sinal',
      statusPagamento: statusPagamento,
      metodoSinal: isSinalPago || isIntegral ? 'pix_inter' : undefined,
      sinalPagoEm: isSinalPago || isIntegral ? new Date().toISOString() : undefined,
      restantePagoEm: isIntegral ? new Date().toISOString() : undefined,
      observacoes,
      criadoEm: new Date().toISOString(),
    };

    const callback = onCriarAgendamento || onSalvar;
    if (callback) {
      callback(novoAgendamento, abrirPix);
    }
  };

  return (
    <div
      id="modal-novo-agendamento"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden my-4">
        <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">Novo Agendamento</h3>
              <p className="text-[10px] text-slate-400">Reserva de horário & bloqueio na Google Agenda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 space-y-3 max-h-[80vh] overflow-y-auto">
          {/* Paciente selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" />
              Paciente
            </label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="novo">+ Cadastrar Novo Paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.whatsapp})
                </option>
              ))}
            </select>

            {pacienteId === 'novo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo *"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp com DDD *"
                    value={novoWhatsapp}
                    onChange={(e) => setNovoWhatsapp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Procedimento */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Procedimento / Terapia
            </label>
            <select
              value={procedimentoId}
              onChange={(e) => setProcedimentoId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {procedimentos.filter((p) => p.ativo).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.duracaoMinutos} min) - R$ {p.precoTotal.toFixed(2)} [Sinal: R$ {p.valorSinal.toFixed(2)}]
                </option>
              ))}
            </select>
          </div>

          {/* Data & Horário */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Horário</label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 flex items-center justify-between text-xs">
            <div className="font-mono text-[11px]">
              <span className="text-slate-700 block">Total: <strong>R$ {precoTotal.toFixed(2)}</strong></span>
              <span className="text-slate-500">Restante a cobrar na sessão: <strong>R$ {valorRestante.toFixed(2)}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase text-emerald-800 block">Sinal 50%</span>
              <span className="text-sm font-bold font-mono text-emerald-700">R$ {valorSinal.toFixed(2)}</span>
            </div>
          </div>

          {/* Status Inicial de Pagamento */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              Status de Pagamento (Controle de Cobrança)
            </label>
            <select
              value={statusPagamento}
              onChange={(e) => setStatusPagamento(e.target.value as StatusPagamento)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none font-semibold text-slate-800"
            >
              <option value="a_pagar">🔴 A Pagar (Nenhum valor recebido)</option>
              <option value="pago_sinal">🟡 Sinal 50% Pago (R$ {valorSinal.toFixed(2)} recebido via Pix)</option>
              <option value="pago_integral">🟢 Pago Integral (100% quitado antecipadamente)</option>
            </select>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Observações</label>
            <textarea
              rows={2}
              placeholder="Queixas específicas, histórico ou preferências..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="btn-salvar-gerar-pix"
              onClick={() => handleSubmit(true)}
              className="w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Salvar & Gerar Pix Inter</span>
            </button>

            <button
              id="btn-salvar-apenas"
              onClick={() => handleSubmit(false)}
              className="w-full py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Salvar Agendamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
