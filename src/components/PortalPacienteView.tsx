import React, { useState, useEffect } from 'react';
import {
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
  Lock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  RefreshCw,
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
import { formatarDataBR } from '../utils/dateUtils';

interface PortalPacienteViewProps {
  procedimentos: Procedimento[];
  configClinica: ConfiguracaoClinica;
  configInter?: ConfiguracaoInfinitePay;
  configInfinitePay?: ConfiguracaoInfinitePay;
  onAgendamentoCriado: (novoAgendamento: Agendamento, registrarSinalAgora: boolean) => Promise<void>;
  onOpenLoginTerapeuta?: () => void;
  onOpenCRM?: () => void;
  onVoltarHome?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const HORARIOS_DISPONIVEIS = [
  '08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'
];

export const PortalPacienteView: React.FC<PortalPacienteViewProps> = ({
  procedimentos,
  configClinica,
  configInter,
  configInfinitePay,
  onAgendamentoCriado,
  onOpenLoginTerapeuta,
  onOpenCRM,
  onVoltarHome,
  onShowToast,
}) => {
  const activeConfig: ConfiguracaoInfinitePay = configInfinitePay || configInter || {
    chavePix: '5521975134597',
    tipoChavePix: 'telefone',
    nomeTitular: 'CAROLINE PADELA',
    cidadeTitular: 'MARICA',
    infiniteTag: 'carolpadela',
    linkPagamento: 'https://infinitepay.io/$carolpadela',
    ambiente: 'producao',
    webhookAtivo: true,
  };

  const handleOpenLogin = () => {
    if (onOpenLoginTerapeuta) {
      onOpenLoginTerapeuta();
    } else if (onOpenCRM) {
      onOpenCRM();
    }
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProc, setSelectedProc] = useState<Procedimento | null>(
    procedimentos.filter((p) => p.ativo)[0] || procedimentos[0] || null
  );

  useEffect(() => {
    if (!selectedProc && procedimentos.length > 0) {
      setSelectedProc(procedimentos.filter((p) => p.ativo)[0] || procedimentos[0]);
    }
  }, [procedimentos, selectedProc]);

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
  const [salvando, setSalvando] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Horários e Dias configurados pela terapeuta
  const horariosDisponiveis = (configClinica.horariosDisponiveis && configClinica.horariosDisponiveis.length > 0)
    ? configClinica.horariosDisponiveis
    : HORARIOS_DISPONIVEIS;

  const diasSemanaAtivos = configClinica.diasSemanaDisponiveis || [1, 2, 3, 4, 5, 6];

  // Ao entrar no Step 4 (Pagamento), gera Pix (50% sinal) e Link de Checkout Cartão (100% integral) InfinitePay
  useEffect(() => {
    if (step === 4 && selectedProc) {
      const valorSinalPix = selectedProc.valorSinal;
      const valorIntegralCartao = selectedProc.precoTotal;
      const orderNsu = `ag-${Date.now()}`;
      setLoadingCheckout(true);

      // 1. Gera dados Pix EMV Instantâneo InfinitePay para o Sinal de 50%
      emitirCobrancaSinalInfinitePay(valorSinalPix, nome || 'Paciente', selectedProc.nome, activeConfig)
        .then((res) => {
          setPixCobranca(res);
        })
        .catch(console.warn);

      // 2. Gera Link de Checkout Seguro InfinitePay para Cartão de Crédito com Valor Integral (100%)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const redirectTarget = activeConfig.redirectUrl || `${currentOrigin}${currentPath}`;
      const finalRedirectUrl = `${redirectTarget}${redirectTarget.includes('?') ? '&' : '?'}order_nsu=${encodeURIComponent(orderNsu)}&status=retorno_infinitepay`;

      criarCheckoutLinkInfinitePay({
        handle: activeConfig.infiniteTag || 'carolpadela',
        valor: valorIntegralCartao,
        descricaoItem: `Pagamento Integral (Cartão de Crédito) - ${selectedProc.nome} (${nome || 'Paciente'})`,
        orderNsu,
        redirectUrl: finalRedirectUrl,
        webhookUrl: activeConfig.webhookUrl,
        cliente: {
          nome: nome || 'Cliente',
          email: email || undefined,
          telefone: whatsapp || undefined,
        },
      })
        .then((res) => {
          setCheckoutUrl(res.checkoutUrl);
        })
        .catch(() => {
          const fallbackTag = (activeConfig.infiniteTag || 'carolpadela').replace(/^\$/, '');
          setCheckoutUrl(`https://infinitepay.io/$${fallbackTag}`);
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

  const handleAbrirCheckoutInfinitePay = async () => {
    if (!selectedProc || salvando) return;
    setSalvando(true);

    try {
      const fallbackTag = (activeConfig.infiniteTag || 'carolpadela').replace(/^\$/, '');
      const url = checkoutUrl || `https://infinitepay.io/$${fallbackTag}`;
      const orderNsu = `ag-${Date.now()}`;

      // No Cartão de Crédito, o pagamento é INTEGRAL (100%)
      const novo: Agendamento = {
        id: orderNsu,
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
        observacoes: observacoes || 'Agendado com Pagamento Integral no Cartão de Crédito via InfinitePay.',
        criadoEm: new Date().toISOString(),
      };

      setAgendamentoFinal(novo);
      await onAgendamentoCriado(novo, false);

      // Abre checkout seguro da InfinitePay em nova aba
      window.open(url, '_blank', 'noopener,noreferrer');
      onShowToast('Ambiente Seguro InfinitePay Aberto!', 'Conclua o pagamento integral no cartão na aba aberta. Seu agendamento será confirmado!', 'info');
      setStep(5);
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao Iniciar Checkout', 'Tente novamente ou use a opção Pix direto.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleFinalizarAgendamentoPix = async (pagoAgora: boolean) => {
    if (!selectedProc || salvando) return;
    setSalvando(true);

    try {
      // No Pix, é cobrado o SINAL (50%) para fechar e garantir o horário
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
        metodoSinal: 'pix_infinitepay',
        pixCopiaECola: pixCobranca?.pixCopiaECola || '',
        pixTxId: pixCobranca?.txid || '',
        sinalPagoEm: pagoAgora ? new Date().toISOString() : undefined,
        observacoes: observacoes || 'Agendado com Sinal 50% via Pix para fechamento de horário.',
        criadoEm: new Date().toISOString(),
      };

      await onAgendamentoCriado(novo, pagoAgora);
      setAgendamentoFinal(novo);
      setStep(5);
    } catch (err: any) {
      console.error(err);
      onShowToast('Erro ao Agendar', 'Não foi possível salvar o agendamento.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleEnviarComprovanteWhatsapp = () => {
    if (!agendamentoFinal) return;

    const dataFormatada = formatarDataBR(agendamentoFinal.data);
    const msg = `🌿 *Confirmação de Agendamento - ${configClinica.nomeClinica}* 🌿

Olá, meu nome é *${agendamentoFinal.pacienteNome}*.
Acabei de reservar meu horário pelo portal online!

💆‍♀️ *Procedimento:* ${agendamentoFinal.procedimentoNome}
🗓️ *Data:* ${dataFormatada} às ${agendamentoFinal.horario}h
💳 *Sinal 50%:* R$ ${agendamentoFinal.valorSinal.toFixed(2)} (${agendamentoFinal.status === 'sinal_pago' ? 'PAGO VIA INFINITEPAY' : 'Processando'})

Poderiam por favor confirmar o agendamento? Aguardo ansioso(a)! ✨`;

    abrirWhatsAppComTexto(configClinica.whatsapp, msg);
  };

  return (
    <div id="portal-paciente-root" className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header Mobile & Desktop */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3.5 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {configClinica.logoUrl ? (
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 p-0.5">
              <img
                src={configClinica.logoUrl}
                alt={configClinica.nomeClinica}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              🌿
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
              {configClinica.nomeClinica || 'Estúdio Caroline Padela'}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {configClinica.nomeTerapeuta || 'Caroline Padela'} • {configClinica.especialidade || 'Liberação Miofascial & Massoterapia'}
            </p>
          </div>
        </div>

        {/* Botões de Ação Topo */}
        <div className="flex items-center gap-2">
          {onVoltarHome && (
            <button
              id="btn-voltar-home-portal"
              onClick={onVoltarHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-all border border-slate-700 active:scale-95 touch-manipulation min-h-[38px] shrink-0 cursor-pointer"
              title="Voltar para a página inicial da clínica"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Página Inicial</span>
              <span className="sm:hidden">Início</span>
            </button>
          )}

          {/* Botão de Acesso CRM */}
          <button
            id="btn-acesso-crm-topo"
            onClick={handleOpenLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all border border-slate-700 active:scale-95 touch-manipulation min-h-[38px] shrink-0 cursor-pointer"
            title="Acessar o painel de gestão do consultório"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Área da Terapeuta</span>
            <span className="sm:hidden">Entrar</span>
          </button>
        </div>
      </header>

      {/* Main Container Centralizado e Otimizado */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-3 sm:p-5 pb-16 sm:pb-8">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
          {/* Header do Card com Stepper */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 font-mono block">
                  Agendamento Online Instantâneo
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  Reserve seu Horário com Garantia (50% InfinitePay)
                </h2>
              </div>
              <div className="text-right hidden sm:block shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">Espaço:</span>
                <span className="text-xs text-slate-300 font-medium">{configClinica.cidadeUf || 'Maricá - RJ'}</span>
              </div>
            </div>

            {/* Stepper Responsivo */}
            {step < 5 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                  {[
                    { s: 1, label: 'Serviço', full: '1. Serviço' },
                    { s: 2, label: 'Data/Hora', full: '2. Data & Hora' },
                    { s: 3, label: 'Dados', full: '3. Identificação' },
                    { s: 4, label: 'Sinal 50%', full: '4. Sinal 50%' },
                  ].map((item) => (
                    <div key={item.s} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="flex items-center gap-1 w-full">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 transition-colors ${
                            step >= item.s
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.s}
                        </div>
                        <div
                          className={`hidden sm:block flex-1 h-0.5 ${
                            step > item.s ? 'bg-emerald-500' : 'bg-slate-800'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[9px] sm:text-[11px] mt-1 truncate max-w-full ${
                          step >= item.s ? 'text-white font-semibold' : 'text-slate-500'
                        }`}
                      >
                        <span className="sm:hidden">{item.label}</span>
                        <span className="hidden sm:inline">{item.full}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Body Conteúdo */}
          <div className="p-4 sm:p-6">
            {/* STEP 1: PROCEDIMENTOS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 uppercase tracking-wider">
                      Selecione o Procedimento Desejado
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      O sinal de 50% garante o bloqueio imediato na agenda. O restante é pago na sessão.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {procedimentos
                    .filter((p) => p.ativo)
                    .map((proc) => {
                      const isSelected = selectedProc?.id === proc.id;
                      return (
                        <div
                          key={proc.id}
                          onClick={() => setSelectedProc(proc)}
                          className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer touch-manipulation min-h-[56px] ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 shadow-sm border-l-4 border-l-emerald-600'
                              : 'border-slate-200 hover:border-emerald-300 active:bg-slate-50 bg-white border-l-4 border-l-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{proc.nome}</h4>
                                <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                                  {proc.categoria}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{proc.descricao}</p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 font-mono">
                                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  {proc.duracaoMinutos} min
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0 font-mono">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                                R$ {proc.precoTotal.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-1">
                                Sinal: R$ {proc.valorSinal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {procedimentos.filter((p) => p.ativo).length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Nenhum procedimento disponível no momento.
                    </div>
                  )}
                </div>

                <button
                  disabled={!selectedProc}
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px] touch-manipulation"
                >
                  <span>Continuar para Data & Horário</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: DATA E HORA */}
            {step === 2 && selectedProc && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 uppercase tracking-wider">
                      Escolha a Data e o Horário
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Para: {selectedProc.nome}</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 p-2 rounded-lg touch-manipulation min-h-[40px]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                </div>

                {/* Data Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Data da Sessão
                  </label>
                  <input
                    type="date"
                    min={hoje}
                    value={selectedData}
                    onChange={(e) => setSelectedData(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono min-h-[46px]"
                  />
                </div>

                {/* Horários Grid */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Horários Disponíveis da Terapeuta</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {horariosDisponiveis.map((hr) => {
                      const isHrSelected = selectedHorario === hr;
                      return (
                        <button
                          key={hr}
                          onClick={() => setSelectedHorario(hr)}
                          className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border font-mono transition-all min-h-[44px] touch-manipulation flex items-center justify-center cursor-pointer ${
                            isHrSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 active:bg-slate-50'
                          }`}
                        >
                          {hr}h
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resumo */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                  <span className="font-medium truncate mr-2">{selectedProc.nome} ({selectedProc.duracaoMinutos} min)</span>
                  <span className="font-bold font-mono text-emerald-800 shrink-0">
                    {formatarDataBR(selectedData)} às {selectedHorario}h
                  </span>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer"
                >
                  <span>Continuar para Seus Dados</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: IDENTIFICAÇÃO DO PACIENTE */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 uppercase tracking-wider">
                      Seus Dados de Contato
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Para confirmação e envio das orientações de cuidado</p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 p-2 rounded-lg touch-manipulation min-h-[40px]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Fernanda Lima Santos"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[46px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (21) 97513-4597"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[46px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        E-mail (opcional)
                      </label>
                      <input
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[46px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Principal queixa / onde você sente dor ou tensão?
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Dor no pescoço e trapézio, lombalgia, cansaço nas pernas..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  disabled={!nome.trim() || !whatsapp.trim()}
                  onClick={() => setStep(4)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer"
                >
                  <span>Ir para Garantia de Horário (50% InfinitePay)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 4: PAGAMENTO 50% INFINITEPAY */}
            {step === 4 && selectedProc && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 uppercase tracking-wider">
                      Garantia de Horário - Sinal 50%
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pagamento seguro processado via InfinitePay</p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 p-2 rounded-lg touch-manipulation min-h-[40px]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                </div>

                {/* Price Breakdown Dinâmico Conforme Forma de Pagamento */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm text-emerald-950 font-bold block truncate">{selectedProc.nome}</span>
                    <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                      {metodoPagamento === 'checkout'
                        ? 'Pagamento Integral (100% no Cartão de Crédito - sem cobrança no dia)'
                        : `Valor Total: R$ ${selectedProc.precoTotal.toFixed(2)} (Restante: R$ ${(selectedProc.precoTotal - selectedProc.valorSinal).toFixed(2)} no dia da sessão)`}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                      {metodoPagamento === 'checkout' ? 'Valor Integral (Cartão)' : 'Sinal de Reserva (Pix)'}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-emerald-700">
                      R$ {metodoPagamento === 'checkout' ? selectedProc.precoTotal.toFixed(2) : selectedProc.valorSinal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMetodoPagamento('checkout')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all touch-manipulation min-h-[44px] cursor-pointer ${
                      metodoPagamento === 'checkout'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Crédito (Integral)</span>
                  </button>

                  <button
                    onClick={() => setMetodoPagamento('pix')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all touch-manipulation min-h-[44px] cursor-pointer ${
                      metodoPagamento === 'pix'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pix (Sinal 50%)</span>
                  </button>
                </div>

                {/* OPÇÃO 1: CARTÃO / CHECKOUT SEGURO OFICIAL INFINITEPAY */}
                {metodoPagamento === 'checkout' ? (
                  <div className="space-y-3.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Ambiente Criptografado Oficial InfinitePay</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-left space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                        <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Pague com Cartão de Crédito (em até 12x) de forma Integral</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        No cartão de crédito, o pagamento é processado de <strong>forma integral (100%)</strong> no ambiente seguro da <strong>InfinitePay</strong>, garantindo sua vaga sem precisar pagar nada no dia do atendimento.
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Estabelecimento: <strong>{activeConfig.nomeTitular || 'CAROLINE PADELA'}</strong></span>
                        <span className="text-emerald-700 font-bold">InfiniteTag: ${activeConfig.infiniteTag || 'carolpadela'}</span>
                      </div>
                    </div>

                    <button
                      disabled={salvando || loadingCheckout}
                      onClick={handleAbrirCheckoutInfinitePay}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 min-h-[50px] touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                      {salvando ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Abrindo InfinitePay...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Pagar R$ {selectedProc.precoTotal.toFixed(2)} (Integral no Cartão)</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400">
                      Ao concluir o pagamento na InfinitePay, seu horário será garantido e confirmado automaticamente.
                    </p>
                  </div>
                ) : (
                  /* OPÇÃO 2: PIX QR CODE DIRETO */
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono inline-block">
                      Aprovação Instantânea • Pix InfinitePay
                    </span>

                    {pixCobranca?.qrCodeDataUrl && (
                      <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs my-1">
                        <img
                          src={pixCobranca.qrCodeDataUrl}
                          alt="QR Code Pix InfinitePay"
                          className="w-36 h-36 mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="text-left bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
                          Titular / Chave Pix
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-800">
                          {activeConfig.nomeTitular || 'CAROLINE PADELA'} ({activeConfig.chavePix})
                        </span>
                      </div>
                      {activeConfig.infiniteTag && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono">
                          ${activeConfig.infiniteTag}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700">Código Pix Copia e Cola</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={pixCobranca?.pixCopiaECola || ''}
                          className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl py-2.5 pl-3 pr-20 text-slate-600 focus:outline-none min-h-[44px]"
                        />
                        <button
                          onClick={handleCopyPix}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 touch-manipulation"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        disabled={salvando}
                        onClick={() => handleFinalizarAgendamentoPix(true)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{salvando ? 'Confirmando...' : 'Já Paguei o Pix / Confirmar Horário'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: COMPROVANTE & SUCESSO */}
            {step === 5 && agendamentoFinal && (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                    {agendamentoFinal.status === 'sinal_pago' ? 'Agendamento Confirmado com Sucesso!' : 'Solicitação de Agendamento Enviada!'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {agendamentoFinal.status === 'sinal_pago'
                      ? 'Recebemos seu sinal de 50% via InfinitePay com garantia de reserva imediata.'
                      : 'Conclua o pagamento na InfinitePay ou envie o comprovante pelo WhatsApp para confirmar seu horário.'}
                  </p>
                </div>

                {/* Comprovante */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Procedimento:</span>
                    <span className="font-bold text-slate-800">{agendamentoFinal.procedimentoNome}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Data e Horário:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      {formatarDataBR(agendamentoFinal.data)} às {agendamentoFinal.horario}h
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Paciente:</span>
                    <span className="font-semibold text-slate-800">{agendamentoFinal.pacienteNome}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Sinal 50%:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      R$ {agendamentoFinal.valorSinal.toFixed(2)} ({agendamentoFinal.status === 'sinal_pago' ? 'PAGO' : 'Pendente'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Restante na sessão:</span>
                    <span className="font-semibold font-mono text-slate-700">
                      R$ {agendamentoFinal.valorRestante.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleEnviarComprovanteWhatsapp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Confirmação no WhatsApp da Terapeuta</span>
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setNome('');
                      setWhatsapp('');
                      setEmail('');
                      setObservacoes('');
                      setAgendamentoFinal(null);
                    }}
                    className="w-full py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer min-h-[40px]"
                  >
                    Fazer Outro Agendamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>
          {configClinica.nomeClinica} • {configClinica.whatsapp && `WhatsApp: ${configClinica.whatsapp}`}
        </p>
      </footer>
    </div>
  );
};
