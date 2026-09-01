import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  QrCode,
  Send,
  Calendar,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Zap,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInfinitePay,
  Procedimento,
} from '../types';
import {
  emitirCobrancaSinalInfinitePay,
  criarCheckoutLinkInfinitePay,
  InfinitePayCobrancaPixResult,
} from '../services/infinitePay';
import { abrirWhatsAppComTexto } from '../services/pdfGenerator';

interface PublicAgendamentoModalProps {
  procedimentos: Procedimento[];
  configClinica: ConfiguracaoClinica;
  configInter?: ConfiguracaoInfinitePay;
  configInfinitePay?: ConfiguracaoInfinitePay;
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
  configInfinitePay,
  onClose,
  onAgendamentoCriado,
  onShowToast,
}) => {
  const activeConfig: ConfiguracaoInfinitePay = configInfinitePay || configInter || {
    chavePix: '5521975134597',
    tipoChavePix: 'telefone',
    nomeTitular: 'CAROLINE PADELA',
    cidadeTitular: 'MARICA',
    infiniteTag: 'caroline-padela',
    linkPagamento: 'https://infinitepay.io/pay/caroline-padela',
    ambiente: 'producao',
    webhookAtivo: true,
  };

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

  // Pagamento InfinitePay
  const [metodoPagamento, setMetodoPagamento] = useState<'checkout' | 'pix'>('checkout');
  const [pixCobranca, setPixCobranca] = useState<InfinitePayCobrancaPixResult | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [agendamentoFinal, setAgendamentoFinal] = useState<Agendamento | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Horários e Dias configurados pela terapeuta
  const horariosDisponiveis = (configClinica.horariosDisponiveis && configClinica.horariosDisponiveis.length > 0)
    ? configClinica.horariosDisponiveis
    : HORARIOS_DISPONIVEIS;

  // Ao entrar no Step 4 (Pagamento), gera Checkout Cartão (Integral 100%) & Pix (Sinal 50%) InfinitePay
  useEffect(() => {
    if (step === 4 && selectedProc) {
      const valorSinalPix = selectedProc.valorSinal;
      const valorIntegralCartao = selectedProc.precoTotal;
      const orderNsu = `ag-${Date.now()}`;
      setLoadingCheckout(true);

      // 1. Gera dados Pix EMV InfinitePay para o Sinal de 50%
      emitirCobrancaSinalInfinitePay(valorSinalPix, nome || 'Paciente', selectedProc.nome, activeConfig)
        .then((res) => {
          setPixCobranca(res);
        })
        .catch(console.warn);

      // 2. Gera Link de Checkout Externo InfinitePay para Cartão de Crédito com Valor Integral (100%)
      criarCheckoutLinkInfinitePay({
        handle: activeConfig.infiniteTag || 'caroline-padela',
        linkPagamento: activeConfig.linkPagamento,
        valor: valorIntegralCartao,
        descricaoItem: `Pagamento Integral (Cartão de Crédito) - ${selectedProc.nome} (${nome || 'Paciente'})`,
        orderNsu,
        redirectUrl: typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}?order_nsu=${encodeURIComponent(orderNsu)}&status=retorno_infinitepay`
          : undefined,
        webhookUrl: activeConfig.webhookUrl,
        cliente: {
          nome: nome || 'Cliente',
          email,
          telefone: whatsapp,
        },
      })
        .then((res) => {
          setCheckoutUrl(res.checkoutUrl);
        })
        .catch(() => {
          const fallbackTag = (activeConfig.infiniteTag || 'caroline-padela').replace(/^\$/, '').trim();
          setCheckoutUrl(activeConfig.linkPagamento || `https://link.infinitepay.io/${fallbackTag}`);
        })
        .finally(() => {
          setLoadingCheckout(false);
        });
    }
  }, [step, selectedProc, nome, email, whatsapp, activeConfig]);

  const handleCopyPix = () => {
    if (!pixCobranca?.pixCopiaECola) return;
    navigator.clipboard.writeText(pixCobranca.pixCopiaECola.trim());
    setCopiedPix(true);
    onShowToast('Código Pix Copiado!', 'Abra o app do seu banco para colar e pagar.', 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleAbrirCheckoutInfinitePay = () => {
    if (!selectedProc) return;
    const fallbackTag = (activeConfig.infiniteTag || 'caroline-padela').replace(/^\$/, '').trim();
    const url = checkoutUrl || activeConfig.linkPagamento || `https://link.infinitepay.io/${fallbackTag}`;
    
    // No Cartão de Crédito, o pagamento é INTEGRAL (100%)
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
      valorSinal: selectedProc.precoTotal,
      valorRestante: 0,
      status: 'aguardando_sinal',
      statusPagamento: 'pago_integral',
      metodoSinal: 'cartao_credito',
      pixCopiaECola: undefined,
      pixTxId: undefined,
      checkoutUrl: url,
      observacoes: observacoes || 'Agendamento com Pagamento Integral no Cartão de Crédito via InfinitePay.',
      criadoEm: new Date().toISOString(),
    };

    setAgendamentoFinal(novo);
    onAgendamentoCriado(novo, false);

    // Abre checkout da InfinitePay em nova aba
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast('Checkout InfinitePay Aberto', 'Conclua o pagamento integral no cartão na aba aberta. Seu horário será confirmado.', 'info');
  };

  const handleFinalizarAgendamento = (pagoAgora: boolean) => {
    if (!selectedProc) return;

    // No Pix, é cobrado o SINAL (50%) para fechar o horário
    const novo: Agendamento = agendamentoFinal || {
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
      metodoSinal: 'pix_infinitepay',
      pixCopiaECola: pixCobranca?.pixCopiaECola,
      pixTxId: pixCobranca?.txid,
      sinalPagoEm: pagoAgora ? new Date().toISOString() : undefined,
      observacoes: observacoes || 'Agendamento com Sinal 50% via Pix.',
      criadoEm: new Date().toISOString(),
    };

    if (pagoAgora) {
      novo.status = 'sinal_pago';
      novo.statusPagamento = 'pago_sinal';
      novo.sinalPagoEm = new Date().toISOString();
    }

    setAgendamentoFinal(novo);
    onAgendamentoCriado(novo, pagoAgora);
    setStep(5);
  };

  const handleEnviarComprovanteWhatsapp = () => {
    if (!agendamentoFinal) return;
    const dataFormatada = new Date(agendamentoFinal.data + 'T12:00:00Z').toLocaleDateString('pt-BR');
    const msg = `🌿 *Olá, ${configClinica.nomeClinica}!*
Acabei de realizar o agendamento da minha sessão pelo site:

👤 *Nome:* ${agendamentoFinal.pacienteNome}
💆‍♀️ *Procedimento:* ${agendamentoFinal.procedimentoNome}
🗓️ *Data:* ${dataFormatada} às ${agendamentoFinal.horario}h
💳 *Sinal (50%):* R$ ${agendamentoFinal.valorSinal.toFixed(2)} (${agendamentoFinal.status === 'sinal_pago' ? 'PAGO VIA INFINITEPAY' : 'Aguardando Pagamento'})

Aguardando confirmação! ✨`;

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
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-400 font-mono block">
                  Agendamento Online
                </span>
                <span className="text-[8px] font-bold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-mono">
                  InfinitePay 50%
                </span>
              </div>
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
                { s: 4, label: 'Sinal (50%)' },
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
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Selecione o Procedimento</h3>
                <p className="text-[11px] text-slate-500">Escolha a terapia desejada para visualizar os detalhes</p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {procedimentos.filter(p => p.ativo).map((p) => {
                  const isSelected = selectedProc?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProc(p)}
                      className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{p.nome}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{p.descricao}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" /> {p.duracaoMinutos} min
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-emerald-700 block">
                            R$ {p.precoTotal.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            Sinal: R$ {p.valorSinal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!selectedProc}
                onClick={() => setStep(2)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Avançar para Data e Horário</span>
              </button>
            </div>
          )}

          {/* STEP 2: Data e Horário */}
          {step === 2 && selectedProc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Escolha Data e Horário</h3>
                  <p className="text-[11px] text-slate-500">{selectedProc.nome} ({selectedProc.duracaoMinutos} min)</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Data do Atendimento</label>
                  <input
                    type="date"
                    min={hoje}
                    value={selectedData}
                    onChange={(e) => setSelectedData(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Horários Disponíveis da Terapeuta</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {horariosDisponiveis.map((h) => {
                      const isSel = selectedHorario === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedHorario(h)}
                          className={`py-1.5 px-2 rounded text-xs font-mono font-medium border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {h}h
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Avançar para Seus Dados</span>
              </button>
            </div>
          )}

          {/* STEP 3: Dados do Paciente */}
          {step === 3 && selectedProc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identificação & Contato</h3>
                  <p className="text-[11px] text-slate-500">Seus dados para confirmação do agendamento</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
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
                      placeholder="Ex: (21) 98765-4321"
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
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ir para Garantia de Horário (Sinal 50%)</span>
              </button>
            </div>
          )}

          {/* STEP 4: Pagamento do Sinal 50% via InfinitePay */}
          {step === 4 && selectedProc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Garantia de Horário - Sinal 50%</h3>
                    <span className="text-[9px] font-bold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                      InfinitePay
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pague com segurança via Checkout Oficial ou Pix Instantâneo</p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
              </div>

              {/* Price Breakdown Banner Dinâmico */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-900 font-bold block">
                    {selectedProc.nome}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {metodoPagamento === 'checkout'
                      ? 'Pagamento Integral (100% no Cartão de Crédito - sem cobrança no dia)'
                      : `Total: R$ ${selectedProc.precoTotal.toFixed(2)} • Restante no dia: R$ ${(selectedProc.precoTotal - selectedProc.valorSinal).toFixed(2)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                    {metodoPagamento === 'checkout' ? 'Valor Integral (Cartão)' : 'Sinal (50% Pix)'}
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    R$ {metodoPagamento === 'checkout' ? selectedProc.precoTotal.toFixed(2) : selectedProc.valorSinal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMetodoPagamento('checkout')}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    metodoPagamento === 'checkout'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Cartão (Integral 100%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPagamento('pix')}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    metodoPagamento === 'pix'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pix (Sinal 50%)</span>
                </button>
              </div>

              {metodoPagamento === 'checkout' ? (
                <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-md p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Ambiente Seguro InfinitePay (Cartão até 12x Integral)</span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    No cartão de crédito, o pagamento é realizado de <strong>forma integral (100%)</strong> pelo checkout seguro da <strong>InfinitePay</strong>, garantindo sua vaga sem pagamento residual no consultório.
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={loadingCheckout}
                      onClick={handleAbrirCheckoutInfinitePay}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-md text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingCheckout ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Pagar R$ {selectedProc.precoTotal.toFixed(2)} (Integral no Cartão)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleFinalizarAgendamento(true)}
                      className="text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Já conclui o pagamento na InfinitePay</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-md p-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono inline-block">
                    Aprovação Instantânea • InfinitePay
                  </span>

                  {pixCobranca?.qrCodeDataUrl && (
                    <div className="inline-block p-1.5 bg-white rounded border border-slate-200 shadow-2xs my-0.5">
                      <img
                        src={pixCobranca.qrCodeDataUrl}
                        alt="QR Code Pix InfinitePay"
                        className="w-32 h-32 mx-auto rounded object-contain"
                      />
                    </div>
                  )}

                  {/* Chave Pix */}
                  <div className="text-left bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Chave Pix InfinitePay</span>
                      <span className="text-xs font-mono font-semibold text-slate-800">{activeConfig.chavePix}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{activeConfig.nomeTitular}</span>
                  </div>

                  {/* Copia e Cola */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-slate-700">Código Pix Copia e Cola</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={pixCobranca?.pixCopiaECola || ''}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md py-1.5 pl-2 pr-16 text-slate-600 focus:outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleFinalizarAgendamento(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Já Paguei o Pix / Confirmar Agendamento</span>
                    </button>
                  </div>
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
                  A reserva do seu horário foi garantida com sucesso via InfinitePay.
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
                  <span className="text-slate-500">Sinal (50%):</span>
                  <span className="font-bold font-mono text-emerald-700">R$ {agendamentoFinal.valorSinal.toFixed(2)} (Pago InfinitePay)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Restante no dia:</span>
                  <span className="font-semibold font-mono text-slate-700">R$ {agendamentoFinal.valorRestante.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleEnviarComprovanteWhatsapp}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Confirmação no WhatsApp da Clínica</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
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
