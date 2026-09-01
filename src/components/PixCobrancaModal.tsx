import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { Agendamento, ConfiguracaoClinica, ConfiguracaoInfinitePay } from '../types';
import { emitirCobrancaSinalInfinitePay, InfinitePayCobrancaPixResult } from '../services/infinitePay';
import { abrirWhatsAppComTexto } from '../services/pdfGenerator';

interface PixCobrancaModalProps {
  isOpen?: boolean;
  agendamento: Agendamento;
  configClinica: ConfiguracaoClinica;
  configInter?: ConfiguracaoInfinitePay;
  configInfinitePay?: ConfiguracaoInfinitePay;
  onClose: () => void;
  onConfirmarSinal?: (agendamentoId: string, metodo: 'pix_infinitepay' | 'pix_inter') => void;
  onConfirmarPagamento?: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PixCobrancaModal: React.FC<PixCobrancaModalProps> = ({
  agendamento,
  configClinica,
  configInter,
  configInfinitePay,
  onClose,
  onConfirmarSinal,
  onConfirmarPagamento,
  onShowToast,
}) => {
  const activeConfig = React.useMemo(() => configInfinitePay || configInter || {
    chavePix: '5521975134597',
    tipoChavePix: 'telefone',
    nomeTitular: 'CAROLINE PADELA',
    cidadeTitular: 'MARICA',
    infiniteTag: '$carolpadela',
    linkPagamento: 'https://infinitepay.io/$carolpadela',
    apiKey: '',
    ambiente: 'producao',
    webhookAtivo: true,
  }, [configInfinitePay, configInter]);

  const [cobranca, setCobranca] = useState<InfinitePayCobrancaPixResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPix() {
      setLoading(true);
      const res = await emitirCobrancaSinalInfinitePay(
        agendamento.valorSinal,
        agendamento.pacienteNome,
        agendamento.procedimentoNome,
        activeConfig
      );
      if (isMounted) {
        setCobranca(res);
        setLoading(false);
      }
    }
    loadPix();
    return () => {
      isMounted = false;
    };
  }, [agendamento.id, agendamento.valorSinal, agendamento.pacienteNome, agendamento.procedimentoNome, activeConfig]);

  const handleCopyPix = () => {
    if (!cobranca?.pixCopiaECola) return;
    navigator.clipboard.writeText(cobranca.pixCopiaECola);
    setCopied(true);
    onShowToast('Código Pix Copiado!', 'Cole no app do seu banco para pagar.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyChave = () => {
    if (!activeConfig.chavePix) return;
    navigator.clipboard.writeText(activeConfig.chavePix);
    setCopiedKey(true);
    onShowToast('Chave Pix Copiada!', activeConfig.chavePix, 'success');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyLink = () => {
    const link = cobranca?.linkPagamento || activeConfig.linkPagamento;
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    onShowToast('Link InfinitePay Copiado!', link, 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    if (!cobranca) return;
    const primeiroNome = agendamento.pacienteNome.split(' ')[0];
    const dataFormatada = new Date(agendamento.data + 'T12:00:00Z').toLocaleDateString('pt-BR');
    const linkPagamento = cobranca.linkPagamento || activeConfig.linkPagamento;

    const msg = `🌿 *${configClinica.nomeClinica}*
*Garantia de Agendamento - Sinal de 50%*

Olá, *${primeiroNome}*! 
Seu agendamento para *${agendamento.procedimentoNome}* foi pré-reservado para o dia *${dataFormatada}* às *${agendamento.horario}h*.

💳 *Valores:*
• Valor total da sessão: R$ ${agendamento.valorTotal.toFixed(2)}
• *Sinal de 50% para confirmação:* *R$ ${agendamento.valorSinal.toFixed(2)}*
• Restante (R$ ${agendamento.valorRestante.toFixed(2)}) a ser pago no dia da sessão.

🔑 *Chave Pix InfinitePay:*
\`${activeConfig.chavePix}\` (${activeConfig.nomeTitular})

📲 *Pix Copia e Cola:*
\`${cobranca.pixCopiaECola}\`
${linkPagamento ? `\n💳 *Ou pague com Cartão de Crédito via InfinitePay:*\n${linkPagamento}` : ''}

Assim que efetuar o pagamento do sinal, seu horário fica 100% garantido! Agradecemos a preferência ✨`;

    abrirWhatsAppComTexto(agendamento.pacienteWhatsapp, msg);
    onShowToast('WhatsApp Aberto', 'Mensagem de cobrança enviada.', 'info');
  };

  const handleSimularConfirmacao = () => {
    setConfirmando(true);
    setTimeout(() => {
      if (onConfirmarPagamento) {
        onConfirmarPagamento();
      } else if (onConfirmarSinal) {
        onConfirmarSinal(agendamento.id, 'pix_infinitepay');
      }
      onShowToast(
        'Sinal de 50% Confirmado!',
        `Recebimento de R$ ${agendamento.valorSinal.toFixed(2)} registrado na InfinitePay e no Fluxo Financeiro.`,
        'success'
      );
      setConfirmando(false);
      onClose();
    }, 800);
  };

  return (
    <div
      id="modal-pix-cobranca"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden my-4">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs uppercase tracking-wider">Cobrança Pix & Cartão (Sinal 50%)</h3>
                <span className="text-[9px] font-bold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                  InfinitePay
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 space-y-3">
          {/* Summary Box */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-md p-2.5 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-900">{agendamento.pacienteNome}</p>
                <p className="text-[11px] text-emerald-800 font-medium">{agendamento.procedimentoNome}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {new Date(agendamento.data + 'T12:00:00Z').toLocaleDateString('pt-BR')} • {agendamento.horario}h
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sinal (50%)
                </span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  R$ {agendamento.valorSinal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60 text-[11px] text-slate-600 font-mono">
              <span>Total: <strong>R$ {agendamento.valorTotal.toFixed(2)}</strong></span>
              <span>Restante no dia: <strong>R$ {agendamento.valorRestante.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* QR Code & Pix Info */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500">Gerando cobrança instantânea InfinitePay...</p>
            </div>
          ) : cobranca ? (
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="p-2 bg-white border border-dashed border-emerald-300 rounded-md shadow-2xs inline-block">
                {cobranca.qrCodeDataUrl ? (
                  <img
                    src={cobranca.qrCodeDataUrl}
                    alt="QR Code Pix InfinitePay"
                    className="w-36 h-36 mx-auto rounded object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    Erro ao carregar QR Code
                  </div>
                )}
              </div>

              {/* Chave Pix Direct */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between gap-2">
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block font-mono">
                    Chave Pix InfinitePay ({activeConfig.tipoChavePix.toUpperCase()})
                  </span>
                  <p className="text-[11px] font-mono font-semibold text-slate-800 truncate">{activeConfig.chavePix}</p>
                </div>
                <button
                  onClick={handleCopyChave}
                  className="shrink-0 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>

              {/* Pix Copia e Cola Box */}
              <div className="w-full space-y-1 text-left">
                <label className="text-[10px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>Pix Copia e Cola (EMV InfinitePay)</span>
                  <span className="text-[9px] text-emerald-600 font-mono">TxID: {cobranca.txid}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={cobranca.pixCopiaECola}
                    className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-md py-1.5 pl-2 pr-16 text-slate-600 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Link de Cartão InfinitePay / InfiniteTag */}
              {(cobranca.linkPagamento || activeConfig.infiniteTag) && (
                <div className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-md flex items-center justify-between gap-2 text-left">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      Cartão de Crédito (InfinitePay Link)
                    </span>
                    <p className="text-[10px] text-slate-600 truncate font-mono">
                      {cobranca.linkPagamento || activeConfig.linkPagamento}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleCopyLink}
                      className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
                    </button>
                    {(cobranca.linkPagamento || activeConfig.linkPagamento) && (
                      <a
                        href={cobranca.linkPagamento || activeConfig.linkPagamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-100 rounded hover:bg-emerald-200 transition-colors"
                        title="Abrir Checkout InfinitePay"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Footer Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="btn-enviar-pix-whatsapp"
                onClick={handleEnviarWhatsApp}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3 text-emerald-700" />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <button
                id="btn-confirmar-sinal-manual"
                disabled={confirmando || agendamento.status === 'sinal_pago' || agendamento.status === 'confirmado'}
                onClick={handleSimularConfirmacao}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                {confirmando ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Confirmar Sinal (50%)</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              Ao confirmar o sinal, o status do agendamento avança e o valor entra no fluxo financeiro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

