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
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">InfiniteTag / Handle do Consultório</label>
              <input
                type="text"
                placeholder="Ex: $carolpadela"
                value={infinitePay.infiniteTag || ''}
                onChange={(e) => setInfinitePay({ ...infinitePay, infiniteTag: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none text-emerald-800 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Link de Pagamento InfinitePay (Opcional)</label>
              <input
                type="text"
                placeholder="https://infinitepay.io/$carolpadela"
                value={infinitePay.linkPagamento || ''}
                onChange={(e) => setInfinitePay({ ...infinitePay, linkPagamento: e.target.value })}
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
              Vantagens da cobrança via InfinitePay:
            </span>
            <p>
              1. <strong>Pix Instantâneo:</strong> O valor do sinal de 50% cai na hora na sua conta InfinitePay com taxa zero.
            </p>
            <p>
              2. <strong>Cartão de Crédito e InfiniteTag:</strong> O paciente pode pagar tanto pelo QR Code Pix quanto pelo seu link <strong>infinitepay.io/$seunome</strong> com as menores taxas do mercado.
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
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">WhatsApp de Atendimento *</label>
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
