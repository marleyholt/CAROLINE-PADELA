import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  QrCode,
  CreditCard,
  Send,
  Calendar,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInter,
  Procedimento,
} from '../types';
import { emitirCobrancaSinalBancoInter, InterCobrancaPixResult } from '../services/pixInter';
import { abrirWhatsAppComTexto } from '../services/pdfGenerator';

interface PublicAgendamentoModalProps {
  procedimentos: Procedimento[];
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  onClose: () => void;
  onAgendamentoCriado: (novoAgendamento: Agendamento, registrarSinalAgora: boolean) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const HORARIOS_DISPONIVEIS = [
  '08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'
];

export const PublicAgendamentoModal: React.FC<PublicAgendamentoModalProps> = ({
  procedimentos,
  configClinica,
  configInter,
  onClose,
  onAgendamentoCriado,
  onShowToast,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProc, setSelectedProc] = useState<Procedimento | null>(procedimentos[0] || null);
  
  // Data e Horário
  const hoje = new Date().toISOString().split('T')[0];
  const [selectedData, setSelectedData] = useState<string>(hoje);
  const [selectedHorario, setSelectedHorario] = useState<string>('14:45');

  // Dados do paciente
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [pixCobranca, setPixCobranca] = useState<InterCobrancaPixResult | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [agendamentoFinal, setAgendamentoFinal] = useState<Agendamento | null>(null);

  // Cartão simulação
  const [cartaoNumero, setCartaoNumero] = useState('');
  const [cartaoNome, setCartaoNome] = useState('');
  const [cartaoValidade, setCartaoValidade] = useState('');
  const [cartaoCvv, setCartaoCvv] = useState('');

  // Ao entrar no Step 4 (Pagamento), gera Pix se método for Pix
  useEffect(() => {
    if (step === 4 && selectedProc && metodoPagamento === 'pix') {
      const valorSinal = selectedProc.valorSinal;
      emitirCobrancaSinalBancoInter(valorSinal, nome || 'Paciente', selectedProc.nome, configInter).then((res) => {
        setPixCobranca(res);
      });
    }
  }, [step, selectedProc, metodoPagamento, nome, configInter]);

  const handleCopyPix = () => {
    if (!pixCobranca?.pixCopiaECola) return;
    navigator.clipboard.writeText(pixCobranca.pixCopiaECola);
    setCopiedPix(true);
    onShowToast('Código Pix Copiado!', 'Abra o app do seu banco para colar e pagar.', 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleFinalizarAgendamento = (pagoAgora: boolean) => {
    if (!selectedProc) return;

    const novo: Agendamento = {
      id: `ag-${Date.now()}`,
      pacienteId: `pac-${Date.now()}`,
      pacienteNome: nome || 'Cliente Web',
      pacienteWhatsapp: whatsapp,
      pacienteEmail: email,
      procedimentoId: selectedProc.id,
      procedimentoNome: selectedProc.nome,
      data: selectedData,
      horario: selectedHorario,
      duracaoMinutos: selectedProc.duracaoMinutos,
      valorTotal: selectedProc.precoTotal,
      valorSinal: selectedProc.valorSinal,
      valorRestante: selectedProc.precoTotal - selectedProc.valorSinal,
      status: pagoAgora ? 'sinal_pago' : 'aguardando_sinal',
      statusPagamento: pagoAgora ? 'pago_sinal' : 'a_pagar',
      metodoSinal: metodoPagamento === 'pix' ? 'pix_inter' : 'cartao_credito',
      pixCopiaECola: pixCobranca?.pixCopiaECola,
      pixTxId: pixCobranca?.txid,
      sinalPagoEm: pagoAgora ? new Date().toISOString() : undefined,
      observacoes: observacoes || 'Agendamento solicitado via link online.',
      criadoEm: new Date().toISOString(),
    };

    setAgendamentoFinal(novo);
    onAgendamentoCriado(novo, pagoAgora);
    setStep(5);
  };

  const handleEnviarComprovanteWhatsapp = () => {
    if (!agendamentoFinal) return;
    const dataFormatada = new Date(agendamentoFinal.data + 'T12:00:00Z').toLocaleDateString('pt-BR');
    const msg = `🌿 *Olá, ${configClinica.nomeClinica}!*
Acabei de agendar uma sessão pelo link online:

👤 *Nome:* ${agendamentoFinal.pacienteNome}
💆‍♀️ *Procedimento:* ${agendamentoFinal.procedimentoNome}
🗓️ *Data:* ${dataFormatada} às ${agendamentoFinal.horario}h
💳 *Sinal 50%:* R$ ${agendamentoFinal.valorSinal.toFixed(2)} (${agendamentoFinal.status === 'sinal_pago' ? 'PAGO VIA PIX INTER' : 'Pendente'})

Poderiam por favor confirmar o recebimento? Aguardo ansioso(a)! ✨`;

    abrirWhatsAppComTexto(configClinica.whatsapp, msg);
  };

  return (
    <div
      id="modal-public-booking"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden my-3 sm:my-6">
        {/* Banner Superior */}
        <div className="bg-slate-900 text-white p-3.5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-lg">
              🌿
            </div>
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400 font-mono block">
                Agendamento Online • Inter 50%
              </span>
              <h2 className="text-sm font-bold">{configClinica.nomeClinica}</h2>
              <p className="text-[11px] text-slate-300">{configClinica.nomeTerapeuta} • {configClinica.especialidade}</p>
            </div>
          </div>

          {/* Stepper Indicator */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
              {[
                { s: 1, label: 'Serviço' },
                { s: 2, label: 'Data/Hora' },
                { s: 3, label: 'Dados' },
                { s: 4, label: 'Sinal 50%' },
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-1">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono ${
                      step >= item.s
                        ? 'bg-emerald-500 text-emerald-950 shadow-2xs'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.s}
                  </div>
                  <span
                    className={`hidden sm:inline text-[10px] ${
                      step >= item.s ? 'text-white font-medium' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3.5">
          {/* STEP 1: Escolha de Procedimento */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Escolha o Procedimento</h3>
                <p className="text-[11px] text-slate-500">
                  Reserva garantida com sinal de 50% via Pix Banco Inter.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {procedimentos.filter((p) => p.ativo).map((proc) => {
                  const isSelected = selectedProc?.id === proc.id;
                  return (
                    <div
                      key={proc.id}
                      onClick={() => setSelectedProc(proc)}
                      className={`p-2.5 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs border-l-3 border-l-emerald-600'
                          : 'border-slate-200 hover:border-emerald-300 bg-white border-l-3 border-l-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{proc.nome}</h4>
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {proc.categoria}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {proc.descricao}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-600 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              {proc.duracaoMinutos} min
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <span className="text-xs font-bold text-slate-900 block">
                            R$ {proc.precoTotal.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            Sinal: R$ {proc.valorSinal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                disabled={!selectedProc}
                onClick={() => setStep(2)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Continuar para Data & Horário</span>
              </button>
            </div>
          )}

          {/* STEP 2: Data e Horário */}
          {step === 2 && selectedProc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Selecione o Dia e Horário</h3>
                  <p className="text-[11px] text-slate-500">Horários disponíveis para {selectedProc.nome}</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
              </div>

              {/* Data Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  Data da Sessão
                </label>
                <input
                  type="date"
                  min={hoje}
                  value={selectedData}
                  onChange={(e) => setSelectedData(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-mono"
                />
              </div>

              {/* Horários Grid */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Horários Disponíveis</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {HORARIOS_DISPONIVEIS.map((hr) => {
                    const isHrSelected = selectedHorario === hr;
                    return (
                      <button
                        key={hr}
                        onClick={() => setSelectedHorario(hr)}
                        className={`py-1.5 px-2 rounded-md text-xs font-bold border font-mono transition-all ${
                          isHrSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {hr}h
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumo do Selecionado */}
              <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-md flex items-center justify-between text-[11px] text-emerald-900">
                <span>{selectedProc.nome} ({selectedProc.duracaoMinutos} min)</span>
                <span className="font-bold font-mono">{new Date(selectedData + 'T12:00:00Z').toLocaleDateString('pt-BR')} às {selectedHorario}h</span>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Continuar para Identificação</span>
              </button>
            </div>
          )}

          {/* STEP 3: Dados do Paciente */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Seus Dados de Contato</h3>
                  <p className="text-[11px] text-slate-500">Para confirmação e envio das orientações pós-sessão</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fernanda Lima Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (11) 98765-4321"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    Principal queixa / onde você sente mais dor ou tensão?
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Dor no pescoço e ombros, dor lombar ao ficar sentado, retenção..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                disabled={!nome.trim() || !whatsapp.trim()}
                onClick={() => setStep(4)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Ir para Pagamento do Sinal (50%)</span>
              </button>
            </div>
          )}

          {/* STEP 4: Pagamento do Sinal 50% via Banco Inter */}
          {step === 4 && selectedProc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Garantia de Horário - Sinal 50%</h3>
                  <p className="text-[11px] text-slate-500">Cobrança instantânea gerada via Banco Inter</p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
              </div>

              {/* Price Breakdown Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-900 font-bold block">
                    {selectedProc.nome}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Total: R$ {selectedProc.precoTotal.toFixed(2)} (Restante: R$ {(selectedProc.precoTotal - selectedProc.valorSinal).toFixed(2)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">Sinal a Pagar</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    R$ {selectedProc.valorSinal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setMetodoPagamento('pix')}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    metodoPagamento === 'pix'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pix Inter (Recomendado)</span>
                </button>

                <button
                  onClick={() => setMetodoPagamento('cartao')}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    metodoPagamento === 'cartao'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {metodoPagamento === 'pix' ? (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-md p-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono inline-block">
                    Aprovação Instantânea • Banco Inter
                  </span>

                  {pixCobranca?.qrCodeDataUrl && (
                    <div className="inline-block p-1.5 bg-white rounded border border-slate-200 shadow-2xs my-0.5">
                      <img
                        src={pixCobranca.qrCodeDataUrl}
                        alt="QR Code Pix"
                        className="w-32 h-32 mx-auto rounded object-contain"
                      />
                    </div>
                  )}

                  {/* Chave Pix */}
                  <div className="text-left bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Chave Pix Clínica</span>
                      <span className="text-xs font-mono font-semibold text-slate-800">{configInter.chavePix}</span>
                    </div>
                  </div>

                  {/* Copia e Cola */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-slate-700">Código Pix Copia e Cola</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={pixCobranca?.pixCopiaECola || ''}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md py-1.5 pl-2 pr-16 text-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                      >
                        {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => handleFinalizarAgendamento(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Já Paguei o Pix / Confirmar Agendamento</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cartaoNumero}
                        onChange={(e) => setCartaoNumero(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">Nome no Cartão</label>
                      <input
                        type="text"
                        placeholder="Como impresso no cartão"
                        value={cartaoNome}
                        onChange={(e) => setCartaoNome(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cartaoValidade}
                          onChange={(e) => setCartaoValidade(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cartaoCvv}
                          onChange={(e) => setCartaoCvv(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFinalizarAgendamento(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pagar R$ {selectedProc.valorSinal.toFixed(2)} no Cartão</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Confirmação & Comprovante */}
          {step === 5 && agendamentoFinal && (
            <div className="text-center space-y-3 py-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Agendamento Confirmado!
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                  A reserva do seu horário foi garantida com sucesso.
                </p>
              </div>

              {/* Comprovante Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Procedimento:</span>
                  <span className="font-bold text-slate-800">{agendamentoFinal.procedimentoNome}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Data e Horário:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {new Date(agendamentoFinal.data + 'T12:00:00Z').toLocaleDateString('pt-BR')} às {agendamentoFinal.horario}h
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-semibold text-slate-800">{agendamentoFinal.pacienteNome}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Sinal 50% (Pago):</span>
                  <span className="font-bold font-mono text-emerald-700">R$ {agendamentoFinal.valorSinal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Restante no dia:</span>
                  <span className="font-semibold font-mono text-slate-700">R$ {agendamentoFinal.valorRestante.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleEnviarComprovanteWhatsapp}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Confirmação no WhatsApp da Clínica</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
