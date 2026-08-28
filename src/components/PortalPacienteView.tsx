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
  Phone,
  MapPin,
  ShieldCheck,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInter,
  Procedimento,
} from '../types';
import { emitirCobrancaSinalBancoInter, InterCobrancaPixResult } from '../services/pixInter';
import { abrirWhatsAppComTexto } from '../services/pdfGenerator';
import { formatarDataBR } from '../utils/dateUtils';

interface PortalPacienteViewProps {
  procedimentos: Procedimento[];
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  onAgendamentoCriado: (novoAgendamento: Agendamento, registrarSinalAgora: boolean) => Promise<void>;
  onOpenLoginTerapeuta?: () => void;
  onOpenCRM?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const HORARIOS_DISPONIVEIS = [
  '08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'
];

export const PortalPacienteView: React.FC<PortalPacienteViewProps> = ({
  procedimentos,
  configClinica,
  configInter,
  onAgendamentoCriado,
  onOpenLoginTerapeuta,
  onOpenCRM,
  onShowToast,
}) => {
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

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [pixCobranca, setPixCobranca] = useState<InterCobrancaPixResult | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [agendamentoFinal, setAgendamentoFinal] = useState<Agendamento | null>(null);
  const [salvando, setSalvando] = useState(false);

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

  const handleFinalizarAgendamento = async (pagoAgora: boolean) => {
    if (!selectedProc || salvando) return;
    setSalvando(true);

    try {
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
        pixCopiaECola: pixCobranca?.pixCopiaECola || '',
        pixTxId: pixCobranca?.txid || '',
        sinalPagoEm: pagoAgora ? new Date().toISOString() : undefined,
        observacoes: observacoes || 'Agendado pelo portal público',
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
💳 *Sinal 50%:* R$ ${agendamentoFinal.valorSinal.toFixed(2)} (${agendamentoFinal.status === 'sinal_pago' ? 'PAGO VIA BANCO INTER' : 'Pendente'})

Poderiam por favor confirmar o agendamento? Aguardo ansioso(a)! ✨`;

    abrirWhatsAppComTexto(configClinica.whatsapp, msg);
  };

  return (
    <div id="portal-paciente-root" className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header Mobile & Desktop */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3.5 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
            🌿
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
              {configClinica.nomeClinica || 'Espaço Terapêutico'}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {configClinica.nomeTerapeuta} • {configClinica.especialidade}
            </p>
          </div>
        </div>

        {/* Botão de Acesso CRM */}
        <button
          id="btn-acesso-crm-topo"
          onClick={handleOpenLogin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all border border-slate-700 active:scale-95 touch-manipulation min-h-[38px] shrink-0 cursor-pointer"
          title="Acessar o painel de gestão do consultório"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Acesso CRM</span>
          <span className="sm:hidden">Entrar</span>
        </button>
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
                  Reserve seu Horário com Garantia (50% Inter)
                </h2>
              </div>
              <div className="text-right hidden sm:block shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">Consultório:</span>
                <span className="text-xs text-slate-300 font-medium">{configClinica.cidadeUf || 'São Paulo - SP'}</span>
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
                  <label className="text-xs font-semibold text-slate-700 block">Horários Disponíveis</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {HORARIOS_DISPONIVEIS.map((hr) => {
                      const isHrSelected = selectedHorario === hr;
                      return (
                        <button
                          key={hr}
                          onClick={() => setSelectedHorario(hr)}
                          className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border font-mono transition-all min-h-[44px] touch-manipulation flex items-center justify-center ${
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
                        placeholder="Ex: (11) 98765-4321"
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
                  <span>Ir para Garantia de Horário (50% Inter)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 4: PAGAMENTO 50% BANCO INTER */}
            {step === 4 && selectedProc && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 uppercase tracking-wider">
                      Garantia de Horário - Sinal 50%
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Cobrança instantânea gerada via Banco Inter</p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 p-2 rounded-lg touch-manipulation min-h-[40px]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                </div>

                {/* Price Breakdown */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm text-emerald-950 font-bold block truncate">{selectedProc.nome}</span>
                    <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                      Total: R$ {selectedProc.precoTotal.toFixed(2)} (Restante: R${' '}
                      {(selectedProc.precoTotal - selectedProc.valorSinal).toFixed(2)} no dia)
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-emerald-800 block">Sinal 50%</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-emerald-700">
                      R$ {selectedProc.valorSinal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMetodoPagamento('pix')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all touch-manipulation min-h-[44px] ${
                      metodoPagamento === 'pix'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pix Inter</span>
                  </button>

                  <button
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all touch-manipulation min-h-[44px] ${
                      metodoPagamento === 'cartao'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>

                {metodoPagamento === 'pix' ? (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono inline-block">
                      Aprovação Instantânea • Banco Inter
                    </span>

                    {pixCobranca?.qrCodeDataUrl && (
                      <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs my-1">
                        <img
                          src={pixCobranca.qrCodeDataUrl}
                          alt="QR Code Pix"
                          className="w-36 h-36 mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="text-left bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
                          Chave Pix da Clínica
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-800">
                          {configInter.chavePix}
                        </span>
                      </div>
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
                        onClick={() => handleFinalizarAgendamento(true)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{salvando ? 'Confirmando...' : 'Já Paguei o Pix / Confirmar Agendamento'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cartaoNumero}
                          onChange={(e) => setCartaoNumero(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="Como impresso no cartão"
                          value={cartaoNome}
                          onChange={(e) => setCartaoNome(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Validade</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={cartaoValidade}
                            onChange={(e) => setCartaoValidade(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cartaoCvv}
                            onChange={(e) => setCartaoCvv(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono min-h-[44px]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={salvando}
                      onClick={() => handleFinalizarAgendamento(true)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{salvando ? 'Processando...' : `Pagar R$ ${selectedProc.valorSinal.toFixed(2)} no Cartão`}</span>
                    </button>
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
                    Agendamento Confirmado com Sucesso!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Recebemos seu agendamento e o sinal de 50% com garantia de reserva na agenda.
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
                    <span className="text-slate-500">Sinal 50% (Pago):</span>
                    <span className="font-bold font-mono text-emerald-700">
                      R$ {agendamentoFinal.valorSinal.toFixed(2)}
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
                    <span>Enviar Confirmação no WhatsApp da Clínica</span>
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setNome('');
                      setWhatsapp('');
                      setEmail('');
                      setObservacoes('');
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
