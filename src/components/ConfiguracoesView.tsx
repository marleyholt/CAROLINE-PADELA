import React, { useState } from 'react';
import {
  Settings,
  Save,
  Building2,
  QrCode,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Calendar,
  CreditCard,
  Lock,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Zap,
  PenTool,
  Palette,
} from 'lucide-react';
import { ConfiguracaoClinica, ConfiguracaoInfinitePay } from '../types';
import { emitirCobrancaSinalInfinitePay } from '../services/infinitePay';

interface ConfiguracoesViewProps {
  configClinica: ConfiguracaoClinica;
  configInter?: ConfiguracaoInfinitePay;
  configInfinitePay?: ConfiguracaoInfinitePay;
  isGoogleConnected: boolean;
  googleUserEmail?: string;
  onConectarGoogle: () => void;
  onSincronizarTodosGoogleCalendar: () => Promise<void>;
  onSalvarClinica: (config: ConfiguracaoClinica) => void;
  onSalvarInter?: (config: ConfiguracaoInfinitePay) => void;
  onSalvarInfinitePay?: (config: ConfiguracaoInfinitePay) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  configClinica,
  configInter,
  configInfinitePay,
  isGoogleConnected,
  googleUserEmail,
  onConectarGoogle,
  onSincronizarTodosGoogleCalendar,
  onSalvarClinica,
  onSalvarInter,
  onSalvarInfinitePay,
  onShowToast,
}) => {
  const [clinica, setClinica] = useState<ConfiguracaoClinica>({ ...configClinica });
  const [infinitePay, setInfinitePay] = useState<ConfiguracaoInfinitePay>({
    ...(configInfinitePay || configInter || {
      chavePix: '5521975134597',
      tipoChavePix: 'telefone',
      nomeTitular: 'CAROLINE PADELA',
      cidadeTitular: 'MARICA',
      infiniteTag: '$carolpadela',
      linkPagamento: 'https://infinitepay.io/$carolpadela',
      apiKey: '',
      ambiente: 'producao',
      webhookAtivo: true,
    }),
  });
  const [testandoPix, setTestandoPix] = useState(false);
  const [sincronizandoTudo, setSincronizandoTudo] = useState(false);
  const [resultadoTestePix, setResultadoTestePix] = useState<string | null>(null);

  // Extrai a cor de fundo da imagem da assinatura para coincidir o fundo do rodapé do PDF
  const extrairCorFundoImagem = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 100;
          canvas.height = img.naturalHeight || img.height || 100;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('#EDF1EB');
            return;
          }
          ctx.drawImage(img, 0, 0);
          // Amostra cantos e bordas superiores para identificar o fundo exato
          const p1 = ctx.getImageData(3, 3, 1, 1).data;
          const p2 = ctx.getImageData(Math.max(0, canvas.width - 4), 3, 1, 1).data;
          const p3 = ctx.getImageData(3, Math.max(0, canvas.height - 4), 1, 1).data;

          // Se a imagem for transparente, usa o sálvia suave padrão
          if (p1[3] < 40 && p2[3] < 40) {
            resolve('#EDF1EB');
            return;
          }

          const r = Math.round((p1[0] + p2[0] + p3[0]) / 3);
          const g = Math.round((p1[1] + p2[1] + p3[1]) / 3);
          const b = Math.round((p1[2] + p2[2] + p3[2]) / 3);

          const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
          resolve(hex);
        } catch {
          resolve('#EDF1EB');
        }
      };
      img.onerror = () => resolve('#EDF1EB');
      img.src = dataUrl;
    });
  };

  const handleSalvarTudo = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarClinica(clinica);
    if (onSalvarInfinitePay) {
      onSalvarInfinitePay(infinitePay);
    } else if (onSalvarInter) {
      onSalvarInter(infinitePay);
    }
    onShowToast('Configurações Salvas!', 'Dados do consultório e configurações da InfinitePay atualizados com sucesso.', 'success');
  };

  const handleTestarPixInfinitePay = async () => {
    setTestandoPix(true);
    setResultadoTestePix(null);
    try {
      const res = await emitirCobrancaSinalInfinitePay(80.0, 'Teste Paciente', 'Sinal 50% Massoterapia', infinitePay);
      setResultadoTestePix(res.pixCopiaECola);
      onShowToast('Integração InfinitePay Válida!', 'Payload Pix EMV gerado com sucesso.', 'success');
    } catch (err) {
      onShowToast('Erro ao testar Pix InfinitePay', 'Verifique a chave Pix informada.', 'error');
    } finally {
      setTestandoPix(false);
    }
  };

  const handleSyncAll = async () => {
    setSincronizandoTudo(true);
    try {
      await onSincronizarTodosGoogleCalendar();
    } finally {
      setSincronizandoTudo(false);
    }
  };

  return (
    <div id="view-configuracoes" className="space-y-3.5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            Configurações do Consultório, Google Agenda & InfinitePay
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gerencie a sincronização de agenda, identidade visual nos relatórios em PDF e recebimentos de sinal via InfinitePay (Pix & Cartão).
          </p>
        </div>

        <button
          id="btn-salvar-configuracoes-topo"
          onClick={handleSalvarTudo}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <form onSubmit={handleSalvarTudo} className="space-y-3.5">
        {/* BLOCO 1: INTEGRAÇÃO GOOGLE CALENDAR (GOOGLE AGENDA) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                    Google Calendar (Google Agenda) & Bloqueio de Horários
                  </h3>
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono border border-amber-200">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                      Desconectado
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Sincroniza automaticamente cada agendamento no seu Google Calendar e trava a data/hora para evitar horários duplicados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onConectarGoogle}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span>{isGoogleConnected ? 'Reconectar Google' : 'Conectar Conta Google'}</span>
              </button>

              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={sincronizandoTudo}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sincronizar todos os agendamentos existentes para a Google Agenda"
                >
                  {sincronizandoTudo ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  <span>Sincronizar Todos</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold text-[11px]">Conta Google Sincronizada:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {isGoogleConnected ? (googleUserEmail || 'Conta Google Ativa') : 'Nenhuma conta conectada (Clique acima para escolher qualquer e-mail)'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1">
              <p className="flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>Escolha de Conta:</strong> Ao clicar no botão acima, a janela do Google permite selecionar livremente qualquer conta de e-mail que você desejar para sincronizar sua agenda.
              </p>
              <p className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <strong>Travamento Automático:</strong> Os atendimentos entram como eventos ocupados na sua agenda do Google Calendar.
              </p>
              <p className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <strong>Status de Cobrança no Título:</strong> Mostra na agenda se o atendimento está <em>🔴 A Pagar</em>, <em>🟡 Sinal 50% Pago</em> ou <em>🟢 Pago Integral</em>.
              </p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: INTEGRAÇÃO INFINITEPAY (PIX, CARTÃO E INFINITETAG) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                    Integração InfinitePay (Pix Instantâneo, Cartão de Crédito e InfiniteTag)
                  </h3>
                  <span className="text-[9px] font-bold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-mono">
                    InfinitePay
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Recebimento do sinal de 50% ou valor integral via Pix e Cartão de Crédito através da InfinitePay.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestarPixInfinitePay}
              disabled={testandoPix}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            >
              {testandoPix ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Testar Emissão InfinitePay</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Tipo de Chave Pix InfinitePay</label>
              <select
                value={infinitePay.tipoChavePix}
                onChange={(e) => setInfinitePay({ ...infinitePay, tipoChavePix: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none"
              >
                <option value="telefone">Telefone Celular</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Chave Pix da Conta InfinitePay *</label>
              <input
                type="text"
                required
                value={infinitePay.chavePix}
                onChange={(e) => setInfinitePay({ ...infinitePay, chavePix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Nome do Titular na InfinitePay *</label>
              <input
                type="text"
                required
                value={infinitePay.nomeTitular}
                onChange={(e) => setInfinitePay({ ...infinitePay, nomeTitular: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">InfiniteTag / Handle do Consultório (sem o $)</label>
              <input
                type="text"
                placeholder="Ex: caroline-padela"
                value={infinitePay.infiniteTag || ''}
                onChange={(e) => setInfinitePay({ ...infinitePay, infiniteTag: e.target.value.replace(/^\$/, '').trim() })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none text-emerald-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Sua tag no app InfinitePay (ex: <code>caroline-padela</code>)</span>
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Link de Pagamento / Cobrança Direta (App InfinitePay)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: https://link.infinitepay.io/caroline-padela ou seu link do App"
                  value={infinitePay.linkPagamento || ''}
                  onChange={(e) => setInfinitePay({ ...infinitePay, linkPagamento: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none"
                />
                <a
                  href={infinitePay.linkPagamento || `https://link.infinitepay.io/${(infinitePay.infiniteTag || 'caroline-padela').replace(/^\$/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                  title="Testar link no navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Testar</span>
                </a>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">No app InfinitePay do celular: vá em Cobrar &gt; Link de Pagamento e cole aqui o seu link</span>
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Webhook URL InfinitePay (Opcional)</label>
              <input
                type="text"
                placeholder="https://seusite.com/api/webhook/infinitepay"
                value={infinitePay.webhookUrl || ''}
                onChange={(e) => setInfinitePay({ ...infinitePay, webhookUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">URL de Redirecionamento (Pós-Pagamento)</label>
              <input
                type="text"
                placeholder="Ex: https://seusite.com ou deixar automático"
                value={infinitePay.redirectUrl || ''}
                onChange={(e) => setInfinitePay({ ...infinitePay, redirectUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Ambiente</label>
              <select
                value={infinitePay.ambiente}
                onChange={(e) => setInfinitePay({ ...infinitePay, ambiente: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none"
              >
                <option value="producao">Produção (InfinitePay Ativo)</option>
                <option value="sandbox">Ambiente de Testes</option>
              </select>
            </div>
          </div>

          {/* Dica sobre a InfinitePay */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 text-[11px] text-emerald-950 space-y-1">
            <span className="font-bold flex items-center gap-1 text-xs text-emerald-900">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              Como funciona o pagamento InfinitePay:
            </span>
            <p>
              1. <strong>InfiniteTag:</strong> Seu nome de usuário no app (ex: <code>caroline-padela</code> sem $).
            </p>
            <p>
              2. <strong>Link de Pagamento:</strong> Se você criou um link de cobrança no app da InfinitePay, cole no campo acima (ex: <code>https://link.infinitepay.io/caroline-padela</code>).
            </p>
            <p>
              3. <strong>Pix Instantâneo:</strong> O QR Code Pix gerado pelo sistema é 100% automático e creditado diretamente na sua chave.
            </p>
          </div>

          {resultadoTestePix && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md space-y-1 text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Teste de Payload Pix InfinitePay Concluído com Sucesso!
              </span>
              <p className="font-mono text-[10px] text-emerald-800 break-all bg-white p-2 rounded border border-emerald-200">
                {resultadoTestePix}
              </p>
            </div>
          )}
        </div>

        {/* BLOCO 3: IDENTIDADE DA CLÍNICA, LOGOMARCA & CABEÇALHO CLÍNICO (PDF) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                Identidade do Consultório, Logomarca & Cabeçalho Clínico (PDF)
              </h3>
              <p className="text-[10px] text-slate-500">
                A logomarca enviada é exibida em todas as páginas da aplicação e aplicada automaticamente no cabeçalho e marca d'água dos relatórios em PDF.
              </p>
            </div>
          </div>

          {/* Campo de Upload de Logomarca */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
                {clinica.logoUrl ? (
                  <img
                    src={clinica.logoUrl}
                    alt="Logomarca da Clínica"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Building2 className="w-6 h-6 mx-auto opacity-50" />
                    <span className="text-[9px] block leading-none mt-1">Sem Logo</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Logomarca Oficial do Consultório</h4>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Envie o logotipo da sua empresa (formato PNG transparente ou JPEG). Será utilizado no topo da aplicação, na marca d'água de proteção e no cabeçalho dos relatórios PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5">
                <span>{clinica.logoUrl ? 'Alterar Logomarca' : 'Fazer Upload de Logo'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        onShowToast('Arquivo muito grande', 'Por favor escolha uma imagem de até 2MB.', 'error');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setClinica((prev) => ({ ...prev, logoUrl: base64 }));
                        onShowToast('Logomarca Carregada!', 'Clique em Salvar Alterações para persistir a nova logo.', 'success');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {clinica.logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setClinica((prev) => ({ ...prev, logoUrl: '' }));
                    onShowToast('Logo removido', 'O logotipo padrão estilizado será usado.', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-md text-xs font-medium transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Campo de Upload de Imagem de Assinatura para o PDF */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-24 h-14 rounded-lg border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1"
                  style={{ backgroundColor: clinica.assinaturaBgColor || '#EDF1EB' }}
                >
                  {clinica.assinaturaUrl ? (
                    <img
                      src={clinica.assinaturaUrl}
                      alt="Assinatura da Terapeuta"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <PenTool className="w-5 h-5 mx-auto opacity-70" />
                      <span className="text-[8px] font-semibold block leading-none mt-1">Padrão Oficial</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                      Imagem de Assinatura Oficial (Rodapé do PDF)
                    </h4>
                    {clinica.assinaturaUrl && (
                      <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono border border-emerald-200">
                        Ativa no PDF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-lg mt-0.5">
                    Envie a imagem da sua assinatura para estampar no rodapé de todos os relatórios clínicos. O sistema detecta automaticamente a cor de fundo da sua imagem para pintar a faixa do PDF no tom correspondente.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{clinica.assinaturaUrl ? 'Alterar Assinatura' : 'Fazer Upload de Assinatura'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          onShowToast('Arquivo muito grande', 'Por favor escolha uma imagem de até 2MB.', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const base64 = event.target?.result as string;
                          const bgColor = await extrairCorFundoImagem(base64);
                          setClinica((prev) => ({
                            ...prev,
                            assinaturaUrl: base64,
                            assinaturaBgColor: bgColor,
                          }));
                          onShowToast('Assinatura e Fundo Carregados!', `Cor de fundo detectada: ${bgColor.toUpperCase()}.`, 'success');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {clinica.assinaturaUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setClinica((prev) => ({
                        ...prev,
                        assinaturaUrl: '',
                        assinaturaBgColor: '#EDF1EB',
                      }));
                      onShowToast('Assinatura Redefinida', 'O rodapé voltará à assinatura caligráfica padrão.', 'info');
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-md text-xs font-medium transition-colors"
                  >
                    Restaurar Padrão
                  </button>
                )}
              </div>
            </div>

            {/* Controle de Cor de Fundo do Rodapé */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-700">Cor de Fundo da Faixa no PDF:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={clinica.assinaturaBgColor || '#EDF1EB'}
                    onChange={(e) => setClinica({ ...clinica, assinaturaBgColor: e.target.value })}
                    className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0"
                    title="Ajustar cor de fundo da assinatura"
                  />
                  <input
                    type="text"
                    value={clinica.assinaturaBgColor || '#EDF1EB'}
                    onChange={(e) => setClinica({ ...clinica, assinaturaBgColor: e.target.value })}
                    className="w-20 px-1.5 py-0.5 rounded border border-slate-200 text-[11px] font-mono uppercase bg-white text-slate-800"
                    placeholder="#EDF1EB"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-500">
                {clinica.assinaturaUrl ? '✓ Fundo sincronizado com a imagem enviada' : 'Fundo padrão sálvia suave (#EDF1EB)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Nome do Consultório / Espaço *</label>
              <input
                type="text"
                required
                value={clinica.nomeClinica}
                onChange={(e) => setClinica({ ...clinica, nomeClinica: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Nome do(a) Terapeuta / Fisioterapeuta *</label>
              <input
                type="text"
                required
                value={clinica.nomeTerapeuta}
                onChange={(e) => setClinica({ ...clinica, nomeTerapeuta: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Registro Profissional (CRT / CREFITO / ABRATH) *</label>
              <input
                type="text"
                required
                placeholder="Ex: CRT 48920 / CREFITO-3 / Terapeuta Integrativa"
                value={clinica.registroProfissional}
                onChange={(e) => setClinica({ ...clinica, registroProfissional: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-800 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Especialidade / Título</label>
              <input
                type="text"
                value={clinica.especialidade}
                onChange={(e) => setClinica({ ...clinica, especialidade: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">
                Telefone (Aparece no PDF) *
              </label>
              <input
                type="text"
                required
                placeholder="(21) 97513-4597"
                value={clinica.telefone}
                onChange={(e) => setClinica({ ...clinica, telefone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">
                E-mail Profissional (Aparece no PDF) *
              </label>
              <input
                type="email"
                required
                placeholder="contato@carolinepadela.com.br"
                value={clinica.email}
                onChange={(e) => setClinica({ ...clinica, email: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">
                Instagram (Aparece no PDF)
              </label>
              <input
                type="text"
                placeholder="@carolpadela"
                value={clinica.instagram || ''}
                onChange={(e) => setClinica({ ...clinica, instagram: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-emerald-800"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">WhatsApp de Atendimento (Envio Automático) *</label>
              <input
                type="text"
                required
                value={clinica.whatsapp}
                onChange={(e) => setClinica({ ...clinica, whatsapp: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">CNPJ ou CPF do Consultório</label>
              <input
                type="text"
                value={clinica.cnpjCpf}
                onChange={(e) => setClinica({ ...clinica, cnpjCpf: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Endereço Completo</label>
              <input
                type="text"
                value={clinica.endereco}
                onChange={(e) => setClinica({ ...clinica, endereco: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Cidade - UF</label>
              <input
                type="text"
                value={clinica.cidadeUf}
                onChange={(e) => setClinica({ ...clinica, cidadeUf: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Texto da Marca d'Água nos Relatórios em PDF</label>
              <input
                type="text"
                value={clinica.textoMarcaDagua}
                onChange={(e) => setClinica({ ...clinica, textoMarcaDagua: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-mono text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
