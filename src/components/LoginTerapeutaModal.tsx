import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  LogIn,
  Crown,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  MASTER_EMAIL,
  TEST_MASTER_EMAIL,
  TEST_MASTER_PASSWORD,
  isMasterEmail,
  loginWithEmailPassword,
  loginWithGoogle,
  getConfigAcessos,
  getUsuariosAcesso,
  saveUsuarioAcesso,
} from '../services/firebase';
import { UsuarioTerapeuta } from '../types';

interface LoginTerapeutaModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onLoginSuccess: (usuarioData: UsuarioTerapeuta) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginTerapeutaModal: React.FC<LoginTerapeutaModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Autenticação com E-mail e Senha
  const handleEmailLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const targetEmail = (overrideEmail !== undefined ? overrideEmail : email).trim().toLowerCase();
    const targetPassword = overridePassword !== undefined ? overridePassword : password;

    if (!targetEmail) {
      setErrorMsg('Por favor, informe o seu e-mail.');
      return;
    }
    if (!targetPassword) {
      setErrorMsg('Por favor, digite sua senha.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Caso especial: Master de Testes (adm@adm.com / 111111) ou Master Principal
      if (
        (targetEmail === TEST_MASTER_EMAIL && targetPassword === TEST_MASTER_PASSWORD) ||
        (isMasterEmail(targetEmail) && (targetPassword === '111111' || targetPassword.length >= 6))
      ) {
        let authUser: User | null = null;
        try {
          const res = await loginWithEmailPassword(targetEmail, targetPassword);
          authUser = res.user;
        } catch (e) {
          console.warn('Tentativa de autenticação Firebase Auth:', e);
        }

        const masterData: UsuarioTerapeuta = {
          id: authUser?.uid || `master-${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: targetEmail,
          nome: targetEmail === TEST_MASTER_EMAIL ? 'Administrador Master (Testes)' : 'Administrador Master',
          role: 'master',
          ativo: true,
          permissoes: {
            agendamentos: true,
            pacientes: true,
            financeiro: true,
            procedimentos: true,
            configuracoes: true,
          },
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };

        await saveUsuarioAcesso(masterData);
        onShowToast('Acesso Master Concedido!', `Bem-vindo(a), ${masterData.nome}`, 'success');
        onLoginSuccess(masterData);
        onClose();
        return;
      }

      // 2. Login de Terapeuta via Firebase Auth E-mail e Senha
      let loggedUser: User | null = null;
      try {
        const res = await loginWithEmailPassword(targetEmail, targetPassword);
        loggedUser = res.user;
      } catch (authErr: any) {
        console.error('Erro de autenticação no Firebase:', authErr);
        if (authErr.code === 'auth/wrong-password') {
          throw new Error('Senha incorreta. Verifique e tente novamente.');
        } else if (authErr.code === 'auth/invalid-email') {
          throw new Error('Formato de e-mail inválido.');
        } else if (authErr.code === 'auth/operation-not-allowed') {
          // Se o provedor de e-mail não estiver ativo no console do Firebase, permite fallback de terapeuta com chave
        } else {
          throw new Error(authErr.message || 'Falha ao autenticar.');
        }
      }

      // Verifica lista de terapeutas
      const usuarios = await getUsuariosAcesso();
      const usuarioCadastrado = usuarios.find(
        (u) => u.email.toLowerCase().trim() === targetEmail
      );

      const configAcessos = await getConfigAcessos();
      const chaveCorreta = chaveAcesso.trim() === configAcessos.chaveAcessoGeral.trim();

      if (usuarioCadastrado) {
        if (!usuarioCadastrado.ativo) {
          setErrorMsg(`O acesso para ${targetEmail} está desativado pelo administrador master.`);
          setLoading(false);
          return;
        }

        const atualizado: UsuarioTerapeuta = {
          ...usuarioCadastrado,
          ultimoAcesso: new Date().toISOString(),
        };
        await saveUsuarioAcesso(atualizado);

        onShowToast('Login Realizado!', `Bem-vinda(o), ${atualizado.nome}`, 'success');
        onLoginSuccess(atualizado);
        onClose();
        return;
      }

      // Se for primeiro acesso e informou a chave da clínica
      if (chaveAcesso.trim() && chaveCorreta) {
        const novoTerapeuta: UsuarioTerapeuta = {
          id: loggedUser?.uid || `terapeuta-${Date.now()}`,
          email: targetEmail,
          nome: targetEmail.split('@')[0],
          role: 'terapeuta',
          ativo: true,
          permissoes: {
            agendamentos: true,
            pacientes: true,
            financeiro: false,
            procedimentos: true,
            configuracoes: false,
          },
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };

        await saveUsuarioAcesso(novoTerapeuta);
        onShowToast('Acesso Liberado com Chave!', `Terapeuta ${targetEmail} autenticado com sucesso`, 'success');
        onLoginSuccess(novoTerapeuta);
        onClose();
        return;
      }

      // Caso não tenha cadastro
      setErrorMsg(
        `A conta ${targetEmail} não possui cadastro. Digite a Chave de Acesso do consultório para criar seu acesso ou solicite ao administrador master (${TEST_MASTER_EMAIL}).`
      );
    } catch (err: any) {
      console.error('Erro no login:', err);
      setErrorMsg(err.message || 'Falha ao realizar login. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { user } = await loginWithGoogle();
      const userEmail = (user.email || '').toLowerCase().trim();

      // Check if Master
      if (isMasterEmail(userEmail)) {
        const masterData: UsuarioTerapeuta = {
          id: user.uid,
          email: userEmail,
          nome: user.displayName || 'Usuário Master',
          fotoUrl: user.photoURL || undefined,
          role: 'master',
          ativo: true,
          permissoes: {
            agendamentos: true,
            pacientes: true,
            financeiro: true,
            procedimentos: true,
            configuracoes: true,
          },
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };

        await saveUsuarioAcesso(masterData);
        onShowToast('Bem-vindo, Usuário Master!', `Acesso total concedido para ${userEmail}`, 'success');
        onLoginSuccess(masterData);
        onClose();
        return;
      }

      // Check in registered therapists list
      const usuarios = await getUsuariosAcesso();
      const usuarioCadastrado = usuarios.find(
        (u) => u.email.toLowerCase().trim() === userEmail
      );

      const configAcessos = await getConfigAcessos();
      const chaveCorreta = chaveAcesso.trim() === configAcessos.chaveAcessoGeral.trim();

      if (usuarioCadastrado) {
        if (!usuarioCadastrado.ativo) {
          setErrorMsg(`O acesso para ${userEmail} está desativado pelo administrador master.`);
          setLoading(false);
          return;
        }

        const atualizado: UsuarioTerapeuta = {
          ...usuarioCadastrado,
          nome: user.displayName || usuarioCadastrado.nome,
          fotoUrl: user.photoURL || usuarioCadastrado.fotoUrl,
          ultimoAcesso: new Date().toISOString(),
        };
        await saveUsuarioAcesso(atualizado);

        onShowToast('Login Realizado!', `Bem-vinda(o), ${atualizado.nome}`, 'success');
        onLoginSuccess(atualizado);
        onClose();
        return;
      }

      // Se informou a chave de acesso da clínica
      if (chaveAcesso.trim() && chaveCorreta) {
        const novoTerapeuta: UsuarioTerapeuta = {
          id: user.uid,
          email: userEmail,
          nome: user.displayName || 'Terapeuta',
          fotoUrl: user.photoURL || undefined,
          role: 'terapeuta',
          ativo: true,
          permissoes: {
            agendamentos: true,
            pacientes: true,
            financeiro: false,
            procedimentos: true,
            configuracoes: false,
          },
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };

        await saveUsuarioAcesso(novoTerapeuta);
        onShowToast('Acesso Liberado com Chave!', `Terapeuta ${userEmail} autenticado com sucesso`, 'success');
        onLoginSuccess(novoTerapeuta);
        onClose();
        return;
      }

      setErrorMsg(
        `A conta ${userEmail} não possui cadastro prévio. Digite a Chave de Acesso do consultório abaixo para primeiro acesso ou solicite ao usuário master (${MASTER_EMAIL}).`
      );
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setErrorMsg(err.message || 'Falha ao autenticar com o Google. Tente pelo login de e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-login-terapeuta"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Superior */}
        <div className="bg-slate-900 text-white p-4 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 font-mono block">
                Painel Clínico & Gestão
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Acesso Terapeuta & Administrador
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selector Tabs: E-mail e Senha vs Google */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>E-mail & Senha</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 min-h-[38px] ${
                activeTab === 'google'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12s.6 2.8 1.6 4.8l3.7-2.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.9 7.4 23 12 23z"
                />
              </svg>
              <span>Google Account</span>
            </button>
          </div>

          {activeTab === 'email' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailLogin();
              }}
              className="space-y-3"
            >
              {/* E-mail Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: adm@adm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>

              {/* Senha Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha (ex: 111111)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono min-h-[44px]"
                />
              </div>

              {/* Chave de Acesso do Consultório (Opcional) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1 font-mono">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  Chave do Consultório (Opcional / 1º Acesso)
                </label>
                <input
                  type="text"
                  placeholder="Chave geral (ex: terapia2026)"
                  value={chaveAcesso}
                  onChange={(e) => setChaveAcesso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono min-h-[40px]"
                />
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-email-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px] touch-manipulation cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>{loading ? 'Entrando no Sistema...' : 'Entrar no CRM Clínico'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {/* Chave de Acesso Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  Chave de Acesso do Consultório (Opcional / 1º Acesso)
                </label>
                <input
                  type="text"
                  placeholder="Digite a chave (ex: terapia2026)"
                  value={chaveAcesso}
                  onChange={(e) => setChaveAcesso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 min-h-[44px]"
                />
              </div>

              {/* Botão Google Login */}
              <button
                id="btn-login-google-action"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 min-h-[46px] touch-manipulation cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12s.6 2.8 1.6 4.8l3.7-2.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.9 7.4 23 12 23z"
                  />
                </svg>
                <span>{loading ? 'Conectando ao Google...' : 'Entrar com Conta Google'}</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-xs font-semibold p-2 touch-manipulation min-h-[38px]"
            >
              Voltar ao Agendamento Online
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
