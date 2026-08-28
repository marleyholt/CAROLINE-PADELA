import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Check,
  KeyRound,
  Crown,
  Users,
  Lock,
  Calendar,
  FileText,
  DollarSign,
  Layers,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { UsuarioTerapeuta, ConfiguracaoAcessos, PermissoesModulos } from '../types';
import { MASTER_EMAIL, saveUsuarioAcesso, deleteUsuarioAcesso, saveConfigAcessos } from '../services/firebase';

interface AcessosViewProps {
  usuarios: UsuarioTerapeuta[];
  configAcessos: ConfiguracaoAcessos;
  onSalvarUsuario: (usuario: UsuarioTerapeuta) => Promise<void>;
  onExcluirUsuario: (id: string) => Promise<void>;
  onSalvarConfigAcessos: (cfg: ConfiguracaoAcessos) => Promise<void>;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AcessosView: React.FC<AcessosViewProps> = ({
  usuarios,
  configAcessos,
  onSalvarUsuario,
  onExcluirUsuario,
  onSalvarConfigAcessos,
  onShowToast,
}) => {
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [permissoesNovo, setPermissoesNovo] = useState<PermissoesModulos>({
    agendamentos: true,
    pacientes: true,
    financeiro: false,
    procedimentos: true,
    configuracoes: false,
  });

  const [chaveAcessoGeral, setChaveAcessoGeral] = useState(configAcessos.chaveAcessoGeral || 'terapia2026');
  const [salvandoChave, setSalvandoChave] = useState(false);

  const handleCadastrarTerapeuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEmail.trim()) {
      onShowToast('E-mail Obrigatório', 'Informe o e-mail Google do terapeuta.', 'error');
      return;
    }

    const emailFormatado = novoEmail.toLowerCase().trim();
    const isMaster = emailFormatado === MASTER_EMAIL.toLowerCase().trim();

    const novo: UsuarioTerapeuta = {
      id: `usr-${Date.now()}`,
      email: emailFormatado,
      nome: novoNome.trim() || (isMaster ? 'Usuário Master' : 'Terapeuta'),
      role: isMaster ? 'master' : 'terapeuta',
      ativo: true,
      permissoes: isMaster
        ? {
            agendamentos: true,
            pacientes: true,
            financeiro: true,
            procedimentos: true,
            configuracoes: true,
          }
        : permissoesNovo,
      criadoEm: new Date().toISOString(),
    };

    await onSalvarUsuario(novo);
    setNovoEmail('');
    setNovoNome('');
    setPermissoesNovo({
      agendamentos: true,
      pacientes: true,
      financeiro: false,
      procedimentos: true,
      configuracoes: false,
    });
    onShowToast('Terapeuta Autorizado!', `Acesso configurado para ${emailFormatado}`, 'success');
  };

  const handleTogglePermissao = async (usuario: UsuarioTerapeuta, modulo: keyof PermissoesModulos) => {
    if (usuario.role === 'master' || usuario.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
      onShowToast('Aviso', 'O usuário Master sempre possui acesso a todos os módulos.', 'info');
      return;
    }

    const atualizado: UsuarioTerapeuta = {
      ...usuario,
      permissoes: {
        ...usuario.permissoes,
        [modulo]: !usuario.permissoes[modulo],
      },
    };

    await onSalvarUsuario(atualizado);
    onShowToast('Permissão Atualizada', `${usuario.nome} - Módulo ${modulo}`, 'success');
  };

  const handleToggleAtivo = async (usuario: UsuarioTerapeuta) => {
    if (usuario.role === 'master' || usuario.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
      onShowToast('Aviso', 'O usuário Master não pode ser desativado.', 'error');
      return;
    }

    const atualizado: UsuarioTerapeuta = {
      ...usuario,
      ativo: !usuario.ativo,
    };

    await onSalvarUsuario(atualizado);
    onShowToast(
      atualizado.ativo ? 'Acesso Ativado' : 'Acesso Bloqueado',
      `Status de ${usuario.email} atualizado.`,
      'info'
    );
  };

  const handleSalvarChaveGeral = async () => {
    setSalvandoChave(true);
    try {
      await onSalvarConfigAcessos({
        ...configAcessos,
        chaveAcessoGeral: chaveAcessoGeral.trim(),
        masterEmail: MASTER_EMAIL,
      });
      onShowToast('Chave de Acesso Atualizada!', 'Nova chave geral salva no Firebase.', 'success');
    } catch {
      onShowToast('Erro ao Salvar', 'Não foi possível atualizar a chave de acesso.', 'error');
    } finally {
      setSalvandoChave(false);
    }
  };

  return (
    <div id="view-gerenciamento-acessos" className="space-y-4">
      {/* Banner Superior Exclusivo Master */}
      <div className="bg-slate-900 text-white rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                Painel Master Exclusivo
              </span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 font-mono px-1.5 py-0.2 rounded">
                {MASTER_EMAIL}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-100">Gerenciamento de Acessos & Terapeutas</h2>
            <p className="text-[11px] text-slate-400">
              Controle quais profissionais da clínica podem acessar cada módulo do sistema e defina as chaves de acesso.
            </p>
          </div>
        </div>

        {/* Chave de Acesso Global Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-md p-2 flex items-center gap-2 shrink-0">
          <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[10px]">
            <span className="text-slate-400 block font-mono">Chave de Acesso Geral:</span>
            <input
              type="text"
              value={chaveAcessoGeral}
              onChange={(e) => setChaveAcessoGeral(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white px-2 py-0.5 rounded text-xs font-mono w-28 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSalvarChaveGeral}
            disabled={salvandoChave}
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors"
          >
            {salvandoChave ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Grid: Formulário de Cadastro + Lista de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Formulário Novo Terapeuta */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Autorizar Terapeuta</h3>
              <p className="text-[10px] text-slate-500">Adicione o e-mail da conta Google da terapeuta</p>
            </div>
          </div>

          <form onSubmit={handleCadastrarTerapeuta} className="space-y-2.5">
            <div>
              <label className="text-[10px] font-semibold text-slate-700 uppercase font-mono block mb-0.5">
                E-mail Google do Terapeuta *
              </label>
              <input
                type="email"
                required
                placeholder="exemplo@gmail.com"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-700 uppercase font-mono block mb-0.5">
                Nome do Profissional
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Camila Monteiro"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Permissões Iniciais */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase text-slate-600 font-mono block">
                Módulos Liberados:
              </span>
              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesNovo.agendamentos}
                    onChange={(e) => setPermissoesNovo({ ...permissoesNovo, agendamentos: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Agenda & Atendimentos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesNovo.pacientes}
                    onChange={(e) => setPermissoesNovo({ ...permissoesNovo, pacientes: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Prontuário & CRM de Pacientes (PDF/WhatsApp)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesNovo.financeiro}
                    onChange={(e) => setPermissoesNovo({ ...permissoesNovo, financeiro: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Controle Financeiro & Faturamento</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesNovo.procedimentos}
                    onChange={(e) => setPermissoesNovo({ ...permissoesNovo, procedimentos: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Procedimentos & Preços</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesNovo.configuracoes}
                    onChange={(e) => setPermissoesNovo({ ...permissoesNovo, configuracoes: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Configurações & API Banco Inter</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Salvar & Liberar Acesso</span>
            </button>
          </form>
        </div>

        {/* Lista de Terapeutas e Permissões */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Usuários com Acesso ({usuarios.length + 1})
                </h3>
                <p className="text-[10px] text-slate-500">Clique nas caixas para conceder ou revogar permissões</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Usuário Master Card Fixo */}
            <div className="p-2.5 rounded border border-amber-300 bg-amber-50/50 border-l-3 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-slate-900">Usuário Master (Leão)</span>
                  <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                    MASTER TOTAL
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 font-mono block">{MASTER_EMAIL}</span>
                <span className="text-[10px] text-emerald-700 font-medium">Acesso irrestrito a todas as funções</span>
              </div>

              <div className="flex flex-wrap gap-1 items-center">
                {['Agenda', 'CRM', 'Financeiro', 'Serviços', 'Config', 'Acessos'].map((m) => (
                  <span key={m} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                    ✓ {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Demais Terapeutas */}
            {usuarios
              .filter((u) => u.email.toLowerCase() !== MASTER_EMAIL.toLowerCase())
              .map((u) => (
                <div
                  key={u.id}
                  className={`p-2.5 rounded border text-xs transition-all ${
                    u.ativo
                      ? 'border-slate-200 bg-white border-l-3 border-l-emerald-600'
                      : 'border-slate-200 bg-slate-50 opacity-75 border-l-3 border-l-slate-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{u.nome}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                            u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {u.ativo ? 'ATIVO' : 'BLOQUEADO'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">{u.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAtivo(u)}
                        className={`px-2 py-0.8 rounded text-[10px] font-semibold border transition-colors ${
                          u.ativo
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.ativo ? 'Suspender' : 'Reativar'}
                      </button>

                      <button
                        onClick={() => onExcluirUsuario(u.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remover Terapeuta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Permissões Toggles */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-mono uppercase text-[9px] mr-1">Permissões:</span>

                    <button
                      onClick={() => handleTogglePermissao(u, 'agendamentos')}
                      className={`px-2 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors ${
                        u.permissoes.agendamentos
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Calendar className="w-2.5 h-2.5" />
                      <span>Agenda: {u.permissoes.agendamentos ? 'Sim' : 'Não'}</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermissao(u, 'pacientes')}
                      className={`px-2 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors ${
                        u.permissoes.pacientes
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>CRM & Prontuário: {u.permissoes.pacientes ? 'Sim' : 'Não'}</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermissao(u, 'financeiro')}
                      className={`px-2 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors ${
                        u.permissoes.financeiro
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <DollarSign className="w-2.5 h-2.5" />
                      <span>Financeiro: {u.permissoes.financeiro ? 'Sim' : 'Não'}</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermissao(u, 'procedimentos')}
                      className={`px-2 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors ${
                        u.permissoes.procedimentos
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Layers className="w-2.5 h-2.5" />
                      <span>Procedimentos: {u.permissoes.procedimentos ? 'Sim' : 'Não'}</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermissao(u, 'configuracoes')}
                      className={`px-2 py-0.5 rounded border font-medium flex items-center gap-1 transition-colors ${
                        u.permissoes.configuracoes
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Settings className="w-2.5 h-2.5" />
                      <span>Configurações: {u.permissoes.configuracoes ? 'Sim' : 'Não'}</span>
                    </button>
                  </div>
                </div>
              ))}

            {usuarios.filter((u) => u.email.toLowerCase() !== MASTER_EMAIL.toLowerCase()).length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
                Nenhum terapeuta adicional cadastrado ainda. Adicione acima para liberar acessos personalizados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
