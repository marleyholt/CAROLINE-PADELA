import React, { useState } from 'react';
import {
  CalendarDays,
  Users,
  TrendingUp,
  Sparkles,
  Settings,
  Plus,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Crown,
  LogOut,
  ChevronRight,
  UserCheck,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ConfiguracaoClinica, ConfiguracaoInter, UsuarioTerapeuta } from '../types';
import { MASTER_EMAIL, isMasterEmail } from '../services/firebase';

export type ActiveTab = 'agendamentos' | 'pacientes' | 'financeiro' | 'procedimentos' | 'configuracoes' | 'acessos';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  clinica?: ConfiguracaoClinica;
  configClinica?: ConfiguracaoClinica;
  configInter?: ConfiguracaoInter;
  pendentesSinalCount?: number;
  currentUser?: UsuarioTerapeuta | null;
  currentTerapeuta?: UsuarioTerapeuta | null;
  onOpenNovoAgendamento: () => void;
  onOpenPublicBooking?: () => void;
  onOpenPublicPortal?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  clinica: propClinica,
  configClinica,
  configInter = {
    chavePix: '',
    tipoChavePix: 'aleatoria',
    nomeTitular: '',
    cidadeTitular: '',
    clientId: '',
    clientSecret: '',
    ambiente: 'sandbox',
    webhookAtivo: false,
  },
  pendentesSinalCount = 0,
  currentUser: propUser,
  currentTerapeuta,
  onOpenNovoAgendamento,
  onOpenPublicBooking,
  onOpenPublicPortal,
  onLogout,
}) => {
  const clinica = propClinica || configClinica || {
    nomeClinica: 'Espaço Terapêutico',
    nomeTerapeuta: '',
    registroProfissional: '',
    especialidade: '',
    whatsapp: '',
    email: '',
    telefone: '',
    endereco: '',
    cidadeUf: '',
    cnpjCpf: '',
    logoUrl: '',
    textoMarcaDagua: '',
    mensagemWhatsappPadrao: '',
  };

  const currentUser = propUser || currentTerapeuta || null;
  const handleOpenPortal = onOpenPublicBooking || onOpenPublicPortal || (() => {});
  const [fullMenuOpen, setFullMenuOpen] = useState(false);

  const isMaster =
    currentUser?.role === 'master' ||
    isMasterEmail(currentUser?.email);

  // Lista de abas com controle de permissão
  const allTabs = [
    {
      id: 'agendamentos' as ActiveTab,
      label: 'Agendamentos',
      shortLabel: 'Agenda',
      description: 'Gestão de horários, confirmações e recebimento de sinal Pix',
      icon: CalendarDays,
      color: 'emerald',
      badge: pendentesSinalCount > 0 ? pendentesSinalCount : null,
      badgeTitle: 'Aguardando 50% Sinal Pix',
      allowed: isMaster || currentUser?.permissoes?.agendamentos !== false,
    },
    {
      id: 'pacientes' as ActiveTab,
      label: 'Pacientes & CRM',
      shortLabel: 'Pacientes',
      description: 'Prontuários, histórico de sessões, ficha de anamnese e contatos',
      icon: Users,
      color: 'blue',
      badge: null,
      allowed: isMaster || currentUser?.permissoes?.pacientes !== false,
    },
    {
      id: 'financeiro' as ActiveTab,
      label: 'Financeiro & Custos',
      shortLabel: 'Financeiro',
      description: 'Fluxo de caixa, recebimentos Pix Inter, custos e balanço',
      icon: TrendingUp,
      color: 'indigo',
      badge: null,
      allowed: isMaster || currentUser?.permissoes?.financeiro === true,
    },
    {
      id: 'procedimentos' as ActiveTab,
      label: 'Procedimentos & Serviços',
      shortLabel: 'Procedimentos',
      description: 'Catálogo de terapias, durações, valores e regras de sinal',
      icon: Sparkles,
      color: 'amber',
      badge: null,
      allowed: isMaster || currentUser?.permissoes?.procedimentos !== false,
    },
    {
      id: 'configuracoes' as ActiveTab,
      label: 'Configurações & Inter',
      shortLabel: 'Configurações',
      description: 'Dados da clínica, chaves Pix, credenciais Banco Inter e WhatsApp',
      icon: Settings,
      color: 'slate',
      badge: null,
      allowed: isMaster || currentUser?.permissoes?.configuracoes === true,
    },
    {
      id: 'acessos' as ActiveTab,
      label: 'Gerenciar Acessos',
      shortLabel: 'Acessos',
      description: 'Controle de terapeutas, permissões de abas e chave geral',
      icon: Crown,
      color: 'amber',
      badge: 'Master',
      badgeTitle: 'Exclusivo Usuário Master',
      allowed: isMaster,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.allowed);

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setFullMenuOpen(false); // Fecha o menu instantaneamente ao escolher uma opção
  };

  return (
    <>
      {/* ================= CABEÇALHO SUPERIOR FIXO (100% LARGURA) ================= */}
      <header className="w-full bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* LADO ESQUERDO: Botão de Menu (Canto Superior Esquerdo) + Identidade Visual */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* BOTÃO DO MENU - CANTO SUPERIOR ESQUERDO */}
            <button
              id="btn-abrir-menu-principal"
              type="button"
              onClick={() => setFullMenuOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 touch-manipulation min-h-[40px] min-w-[40px] shrink-0 cursor-pointer shadow-xs"
              title="Abrir Menu Completo"
              aria-label="Abrir Menu de Navegação"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
              <span className="hidden sm:inline text-xs font-bold text-slate-200">Menu</span>
            </button>

            {/* Logo e Nome da Clínica */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-sm font-bold shadow-inner shrink-0">
                🌿
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-xs">
                  {clinica.nomeClinica || 'Espaço Terapêutico'}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate font-mono">CRMFISIO</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTRO: Abas de Acesso Rápido em Desktop */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full font-mono ${
                        tab.id === 'acessos'
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* LADO DIREITO: Ações Rápidas (+ Agendar, Portal Paciente, Sair) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-novo-horario-topo"
              type="button"
              onClick={onOpenNovoAgendamento}
              className="px-2.5 sm:px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all touch-manipulation min-h-[40px] cursor-pointer"
              title="Criar novo agendamento de sessão"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Horário</span>
            </button>

            <button
              id="btn-portal-paciente-topo"
              type="button"
              onClick={handleOpenPortal}
              className="px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] cursor-pointer"
              title="Abrir o portal público de auto-agendamento do paciente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Portal Paciente</span>
            </button>

            {/* Logout Rápido */}
            <button
              id="btn-logout-topo"
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title="Desconectar da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MENU EM TELA CHEIA (FULL-SCREEN OVERLAY) ================= */}
      {fullMenuOpen && (
        <div
          id="menu-fullscreen-overlay"
          className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-lg flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-white"
        >
          {/* Barra Superior do Menu em Tela Cheia */}
          <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                🌿
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 font-mono block">
                  Navegação do Sistema
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {clinica.nomeClinica || 'Espaço Terapêutico'}
                </h2>
              </div>
            </div>

            {/* BOTÃO FECHAR MENU (X) */}
            <button
              id="btn-fechar-menu-fullscreen"
              type="button"
              onClick={() => setFullMenuOpen(false)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px] min-w-[44px] cursor-pointer"
              title="Fechar menu e voltar"
            >
              <X className="w-6 h-6 text-slate-300" />
            </button>
          </div>

          {/* Grid Central de Módulos (Grandes e Fáceis de Tocar) */}
          <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold mb-3">
                Selecione o Módulo Desejado:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`menu-item-${tab.id}`}
                      type="button"
                      onClick={() => handleSelectTab(tab.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 group cursor-pointer touch-manipulation min-h-[80px] ${
                        isActive
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                          : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3
                            className={`text-sm font-bold truncate ${
                              isActive ? 'text-emerald-300' : 'text-white'
                            }`}
                          >
                            {tab.label}
                          </h3>
                          {tab.badge && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ${
                                tab.id === 'acessos'
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-rose-500 text-white animate-pulse'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações de Atalho Rápido */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Atalhos Rápidos:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenNovoAgendamento();
                    setFullMenuOpen(false);
                  }}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Agendamento Manual</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenPortal();
                    setFullMenuOpen(false);
                  }}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Ver Portal do Paciente</span>
                </button>
              </div>
            </div>

            {/* Perfil Conectado & Logout no Rodapé */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold text-sm flex items-center justify-center">
                  {currentUser?.nome ? currentUser.nome.slice(0, 2).toUpperCase() : 'TF'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white">
                      {currentUser?.nome || 'Terapeuta'}
                    </p>
                    {isMaster && (
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30 flex items-center gap-1 font-mono">
                        <Crown className="w-3 h-3 text-amber-400" />
                        MASTER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{currentUser?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFullMenuOpen(false);
                  onLogout();
                }}
                className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[42px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Header = Sidebar;
