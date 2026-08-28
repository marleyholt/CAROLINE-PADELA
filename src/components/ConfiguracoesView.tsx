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
} from 'lucide-react';
import { ConfiguracaoClinica, ConfiguracaoInter } from '../types';
import { emitirCobrancaSinalBancoInter } from '../services/pixInter';

interface ConfiguracoesViewProps {
  configClinica: ConfiguracaoClinica;
  configInter: ConfiguracaoInter;
  isGoogleConnected: boolean;
  googleUserEmail?: string;
  onConectarGoogle: () => void;
  onSincronizarTodosGoogleCalendar: () => Promise<void>;
  onSalvarClinica: (config: ConfiguracaoClinica) => void;
  onSalvarInter: (config: ConfiguracaoInter) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  configClinica,
  configInter,
  isGoogleConnected,
  googleUserEmail,
  onConectarGoogle,
  onSincronizarTodosGoogleCalendar,
  onSalvarClinica,
  onSalvarInter,
  onShowToast,
}) => {
  const [clinica, setClinica] = useState<ConfiguracaoClinica>({ ...configClinica });
  const [inter, setInter] = useState<ConfiguracaoInter>({ ...configInter });
  const [testandoPix, setTestandoPix] = useState(false);
  const [sincronizandoTudo, setSincronizandoTudo] = useState(false);
  const [resultadoTestePix, setResultadoTestePix] = useState<string | null>(null);

  const handleSalvarTudo = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarClinica(clinica);
    onSalvarInter(inter);
    onShowToast('Configurações Salvas!', 'Dados do consultório e configurações bancárias atualizados.', 'success');
  };

  const handleTestarPixInter = async () => {
    setTestandoPix(true);
    setResultadoTestePix(null);
    try {
      const res = await emitirCobrancaSinalBancoInter(80.0, 'Teste Inter', 'Sinal 50% Massoterapia', inter);
      setResultadoTestePix(res.pixCopiaECola);
      onShowToast('Integração Inter Válida!', 'Payload Pix EMV gerado com sucesso.', 'success');
    } catch (err) {
      onShowToast('Erro ao testar Pix', 'Verifique a chave Pix informada.', 'error');
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
            Configurações do Consultório, Google Agenda & Banco Inter
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gerencie a sincronização de agenda, dados da clínica para os relatórios em PDF e chaves de pagamento via Banco Inter.
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
              <span className="font-semibold text-[11px]">Conta Google Vinculada:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {googleUserEmail || 'leaog.8@gmail.com'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1">
              <p className="flex items-center gap-1 font-medium text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>Travamento Automático:</strong> Os atendimentos entram como eventos ocupados na sua agenda do Google.
              </p>
              <p className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <strong>Status de Cobrança no Título:</strong> Mostra na agenda se o atendimento está <em>🔴 A Pagar</em>, <em>🟡 Sinal 50% Pago</em> ou <em>🟢 Pago Integral</em>.
              </p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: INTEGRAÇÃO BANCO INTER (PIX, CARTÃO E WEBHOOK) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                    Integração Banco Inter (Cobrança Pix & Cartão de Crédito)
                  </h3>
                  <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-mono">
                    API Banco Inter
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Configuração para recebimento de 50% de sinal via Pix Dinâmico e Cartão de Crédito.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestarPixInter}
              disabled={testandoPix}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded text-xs font-semibold flex items-center gap-1 transition-colors border border-amber-300 shadow-2xs cursor-pointer"
            >
              {testandoPix ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Testar Emissão Pix</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Tipo de Chave Pix Inter</label>
              <select
                value={inter.tipoChavePix}
                onChange={(e) => setInter({ ...inter, tipoChavePix: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none"
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone Celular</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Chave Pix Cadastrada no Inter *</label>
              <input
                type="text"
                required
                value={inter.chavePix}
                onChange={(e) => setInter({ ...inter, chavePix: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Nome do Titular na Conta Inter *</label>
              <input
                type="text"
                required
                value={inter.nomeTitular}
                onChange={(e) => setInter({ ...inter, nomeTitular: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Client ID (API Banco Inter)</label>
              <input
                type="text"
                placeholder="Gerado no Internet Banking do Inter"
                value={inter.clientId}
                onChange={(e) => setInter({ ...inter, clientId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Client Secret (API Banco Inter)</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={inter.clientSecret}
                onChange={(e) => setInter({ ...inter, clientSecret: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[11px] text-slate-700 block mb-1">Ambiente de Operação</label>
              <select
                value={inter.ambiente}
                onChange={(e) => setInter({ ...inter, ambiente: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:outline-none"
              >
                <option value="producao">Produção (Pix Real & Ativo)</option>
                <option value="sandbox">Sandbox / Testes</option>
              </select>
            </div>
          </div>

          {/* Dica para o usuário leigo sobre o Banco Inter */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-md p-2.5 text-[11px] text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1 text-xs text-amber-950">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              Como obter as credenciais no Banco Inter:
            </span>
            <p>
              1. Acesse o <strong>Internet Banking PJ do Banco Inter</strong> no computador.
            </p>
            <p>
              2. Vá no menu <strong>Configurações &gt; Gestão de Acessos / API</strong>.
            </p>
            <p>
              3. Crie uma nova aplicação para <strong>Pix Cobrança Imediata e Cartão</strong> e copie o <strong>Client ID</strong> e <strong>Client Secret</strong> para os campos acima.
            </p>
          </div>

          {resultadoTestePix && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md space-y-1 text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Teste de Payload Pix Inter Concluído com Sucesso!
              </span>
              <p className="font-mono text-[10px] text-emerald-800 break-all bg-white p-2 rounded border border-emerald-200">
                {resultadoTestePix}
              </p>
            </div>
          )}
        </div>

        {/* BLOCO 3: IDENTIDADE DA CLÍNICA & CABEÇALHO CLÍNICO (PDF) */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                Identidade do Consultório & Cabeçalho Clínico (PDF)
              </h3>
              <p className="text-[10px] text-slate-500">
                Esses dados aparecem timbrados nos relatórios em PDF de evolução e nas mensagens enviadas aos pacientes.
              </p>
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
