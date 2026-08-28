import React, { useState, useEffect } from 'react';
import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInter,
  EvolucaoClinica,
  Paciente,
  Procedimento,
  TransacaoFinanceira,
  UsuarioTerapeuta,
  ConfiguracaoAcessos,
  StatusPagamento,
} from './types';
import { StorageService, DEFAULT_CLINICA, DEFAULT_INTER, DEFAULT_PROCEDIMENTOS } from './services/storage';
import { Sidebar, ActiveTab } from './components/Header';
import { AgendamentosView } from './components/AgendamentosView';
import { PacientesCRMView } from './components/PacientesCRMView';
import { FinanceiroView } from './components/FinanceiroView';
import { ProcedimentosView } from './components/ProcedimentosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { AcessosView } from './components/AcessosView';
import { PortalPacienteView } from './components/PortalPacienteView';
import { LoginTerapeutaModal } from './components/LoginTerapeutaModal';
import { NovoAgendamentoModal } from './components/NovoAgendamentoModal';
import { PixCobrancaModal } from './components/PixCobrancaModal';
import { PublicAgendamentoModal } from './components/PublicAgendamentoModal';
import { EvolucaoModal } from './components/EvolucaoModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  MASTER_EMAIL,
  MASTER_EMAILS,
  TEST_MASTER_EMAIL,
  isMasterEmail,
  auth,
  subscribeToAuthState,
  loginWithGoogle,
  logoutUser,
  getCachedGoogleAccessToken,
  subscribeAgendamentos,
  saveAgendamentoFirestore,
  deleteAgendamentoFirestore,
  subscribePacientes,
  savePacienteFirestore,
  deletePacienteFirestore,
  subscribeEvolucoes,
  saveEvolucaoFirestore,
  deleteEvolucaoFirestore,
  subscribeProcedimentos,
  saveProcedimentoFirestore,
  deleteProcedimentoFirestore,
  subscribeFinanceiro,
  saveFinanceiroFirestore,
  deleteFinanceiroFirestore,
  subscribeUsuariosAcesso,
  saveUsuarioAcesso,
  deleteUsuarioAcesso,
  getConfigAcessos,
  saveConfigAcessos,
  getClinicaFirestore,
  saveClinicaFirestore,
  subscribeClinicaFirestore,
  getInterFirestore,
  saveInterFirestore,
  subscribeInterFirestore,
} from './services/firebase';
import {
  criarEventoGoogleCalendar,
  atualizarEventoGoogleCalendar,
  excluirEventoGoogleCalendar,
  sincronizarAgendamentosEmMassa,
} from './services/googleCalendar';
import { User } from 'firebase/auth';

export default function App() {
  // Mode: Patient Portal or Therapist CRM
  const [viewMode, setViewMode] = useState<'portal_paciente' | 'crm_terapeuta'>('portal_paciente');
  const [activeTab, setActiveTab] = useState<ActiveTab>('agendamentos');

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentTerapeuta, setCurrentTerapeuta] = useState<UsuarioTerapeuta | null>(null);
  const [modalLoginOpen, setModalLoginOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Application Data State
  const [clinica, setClinica] = useState<ConfiguracaoClinica>(StorageService.getClinica());
  const [inter, setInter] = useState<ConfiguracaoInter>(StorageService.getInter());
  const [configAcessos, setConfigAcessos] = useState<ConfiguracaoAcessos>({
    terapeutasPodemExcluir: false,
    terapeutasAcessamFinanceiroTotal: true,
  });

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(StorageService.getProcedimentos());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(StorageService.getAgendamentos());
  const [pacientes, setPacientes] = useState<Paciente[]>(StorageService.getPacientes());
  const [evolucoes, setEvolucoes] = useState<EvolucaoClinica[]>(StorageService.getEvolucoes());
  const [financeiro, setFinanceiro] = useState<TransacaoFinanceira[]>(StorageService.getFinanceiro());
  const [usuariosAcesso, setUsuariosAcesso] = useState<UsuarioTerapeuta[]>([]);

  // Modals & UI States
  const [modalNovoAgendamento, setModalNovoAgendamento] = useState(false);
  const [modalPublicBooking, setModalPublicBooking] = useState(false);
  const [agendamentoPixModal, setAgendamentoPixModal] = useState<Agendamento | null>(null);
  const [evolucaoModalData, setEvolucaoModalData] = useState<{
    paciente: Paciente;
    evolucao?: EvolucaoClinica;
    procedimento?: string;
  } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string = '', type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = subscribeToAuthState((user, token) => {
      setFirebaseUser(user);
      if (token) {
        setIsGoogleConnected(true);
      } else {
        setIsGoogleConnected(!!getCachedGoogleAccessToken());
      }

      if (user) {
        const userEmail = (user.email || '').toLowerCase().trim();

        if (isMasterEmail(userEmail)) {
          const masterUser: UsuarioTerapeuta = {
            id: user.uid || 'master-user',
            nome: userEmail === TEST_MASTER_EMAIL ? 'Administrador Master (Testes)' : (user.displayName || 'Usuário Master'),
            email: userEmail,
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
          };
          setCurrentTerapeuta(masterUser);
        } else {
          const found = usuariosAcesso.find((u) => u.email.toLowerCase().trim() === userEmail);
          if (found && found.ativo) {
            setCurrentTerapeuta(found);
          }
        }
      } else {
        // Keep currentTerapeuta if established by local master test session
        if (currentTerapeuta?.role !== 'master') {
          setCurrentTerapeuta(null);
          setIsGoogleConnected(false);
        }
      }
    });

    return () => unsubAuth();
  }, [usuariosAcesso, currentTerapeuta]);

  // 2. Real-time Firebase Public Sync (Agendamentos, Procedimentos, Configs)
  useEffect(() => {
    const unsubClinica = subscribeClinicaFirestore((c) => {
      if (c) {
        setClinica(c);
        StorageService.saveClinica(c);
      }
    });

    const unsubInter = subscribeInterFirestore((i) => {
      if (i) {
        setInter(i);
        StorageService.saveInter(i);
      }
    });

    getConfigAcessos().then((ca) => {
      if (ca) setConfigAcessos(ca);
    });

    const unsubAgendamentos = subscribeAgendamentos((items) => {
      setAgendamentos(items);
      StorageService.saveAgendamentos(items);
    });

    const unsubProcedimentos = subscribeProcedimentos((items) => {
      if (items.length === 0 && procedimentos.length > 0) {
        if (firebaseUser) {
          procedimentos.forEach((p) => saveProcedimentoFirestore(p));
        }
      } else if (items.length > 0) {
        setProcedimentos(items);
        StorageService.saveProcedimentos(items);
      }
    });

    return () => {
      unsubClinica();
      unsubInter();
      unsubAgendamentos();
      unsubProcedimentos();
    };
  }, [firebaseUser]);

  // 3. Real-time Authenticated CRM Sync (Pacientes, Evoluções, Financeiro, Usuários)
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubPacientes = subscribePacientes((items) => {
      setPacientes(items);
      StorageService.savePacientes(items);
    });

    const unsubEvolucoes = subscribeEvolucoes((items) => {
      setEvolucoes(items);
      StorageService.saveEvolucoes(items);
    });

    const unsubFinanceiro = subscribeFinanceiro((items) => {
      setFinanceiro(items);
      StorageService.saveFinanceiro(items);
    });

    const unsubUsuarios = subscribeUsuariosAcesso((items) => {
      setUsuariosAcesso(items);
    });

    return () => {
      unsubPacientes();
      unsubEvolucoes();
      unsubFinanceiro();
      unsubUsuarios();
    };
  }, [firebaseUser]);

  // Save changes to Firestore
  const handleSaveClinica = async (newClinica: ConfiguracaoClinica) => {
    setClinica(newClinica);
    StorageService.saveClinica(newClinica);
    await saveClinicaFirestore(newClinica);
    showToast('Configurações Salvas', 'Dados da clínica atualizados no Firebase.', 'success');
  };

  const handleSaveInter = async (newInter: ConfiguracaoInter) => {
    setInter(newInter);
    StorageService.saveInter(newInter);
    await saveInterFirestore(newInter);
    showToast('Configurações do Inter Salvas', 'Chaves Pix e parâmetros atualizados.', 'success');
  };

  // Google Calendar Integration Handlers
  const handleConectarGoogle = async () => {
    try {
      const { accessToken } = await loginWithGoogle();
      if (accessToken) {
        setIsGoogleConnected(true);
        showToast('Google Agenda Conectada!', 'Eventos e bloqueios sincronizados com sucesso.', 'success');
      }
    } catch (err: any) {
      showToast('Erro ao conectar Google', err?.message || 'Falha na autenticação Google.', 'error');
    }
  };

  const handleSincronizarAgendamentoGoogle = async (ag: Agendamento) => {
    const token = getCachedGoogleAccessToken();
    if (!token) {
      showToast('Autenticação Necessária', 'Conecte sua conta Google para sincronizar com a agenda.', 'info');
      await handleConectarGoogle();
      return;
    }

    try {
      let eventId = ag.googleEventId;
      if (eventId) {
        await atualizarEventoGoogleCalendar(ag, clinica, token);
      } else {
        eventId = await criarEventoGoogleCalendar(ag, clinica, token);
      }

      if (eventId) {
        const updated: Agendamento = {
          ...ag,
          googleEventId: eventId,
          googleCalendarSynced: true,
        };
        await saveAgendamentoFirestore(updated);
        showToast('Google Agenda Sincronizada!', `Horário de ${ag.pacienteNome} bloqueado na sua conta Google.`, 'success');
      }
    } catch (err: any) {
      showToast('Erro no Google Calendar', err?.message || 'Não foi possível sincronizar o evento.', 'error');
    }
  };

  const handleSincronizarTodosGoogle = async () => {
    const token = getCachedGoogleAccessToken();
    if (!token) {
      showToast('Autenticação Necessária', 'Faça login com Google para sincronizar.', 'info');
      await handleConectarGoogle();
      return;
    }

    try {
      const results = await sincronizarAgendamentosEmMassa(agendamentos, clinica, token);
      let count = 0;
      for (const res of results) {
        if (res.eventId) {
          const original = agendamentos.find((a) => a.id === res.agendamentoId);
          if (original) {
            await saveAgendamentoFirestore({
              ...original,
              googleEventId: res.eventId,
              googleCalendarSynced: true,
            });
            count++;
          }
        }
      }
      showToast('Sincronização Concluída!', `${count} agendamento(s) bloqueados no Google Calendar.`, 'success');
    } catch (err: any) {
      showToast('Erro na Sincronização', err?.message || 'Falha ao sincronizar agenda.', 'error');
    }
  };

  // Handlers: Agendamentos
  const handleCriarAgendamento = async (novo: Agendamento, abrirPix: boolean) => {
    let agendamentoFinal = { ...novo };

    // Try Google Calendar sync if token is available
    const token = getCachedGoogleAccessToken();
    if (token) {
      try {
        const eventId = await criarEventoGoogleCalendar(novo, clinica, token);
        if (eventId) {
          agendamentoFinal.googleEventId = eventId;
          agendamentoFinal.googleCalendarSynced = true;
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Google Calendar:', err);
      }
    }

    // 1. Save in Firestore
    await saveAgendamentoFirestore(agendamentoFinal);

    // 2. If patient is new, register in CRM
    const existingPac = pacientes.find((p) => p.id === novo.pacienteId || p.whatsapp === novo.pacienteWhatsapp);
    if (!existingPac) {
      const novoPac: Paciente = {
        id: novo.pacienteId || `pac-${Date.now()}`,
        nome: novo.pacienteNome,
        whatsapp: novo.pacienteWhatsapp,
        email: novo.pacienteEmail || '',
        dataNascimento: '',
        profissao: '',
        queixaInicial: novo.observacoes || '',
        historicoMedico: '',
        medicacoesUso: '',
        contraindicacoesAlergias: '',
        nivelAtividadeFisica: 'moderado',
        dataCadastro: new Date().toISOString().split('T')[0],
        totalSessoes: 1,
      };
      if (firebaseUser) {
        await savePacienteFirestore(novoPac);
      }
    }

    setModalNovoAgendamento(false);

    if (abrirPix) {
      setAgendamentoPixModal(agendamentoFinal);
    } else {
      showToast('Agendamento Criado!', `${agendamentoFinal.pacienteNome} - ${agendamentoFinal.procedimentoNome}`, 'success');
    }
  };

  const handleConfirmarSinal = async (agendamentoId: string, metodo: 'pix_inter') => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return;

    const updated: Agendamento = {
      ...ag,
      status: 'sinal_pago',
      statusPagamento: 'pago_sinal',
      metodoSinal: metodo,
      sinalPagoEm: new Date().toISOString(),
    };

    // Update in Google Calendar if synced
    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    await saveAgendamentoFirestore(updated);

    // Register financial transaction (50% signal)
    if (firebaseUser) {
      const tx: TransacaoFinanceira = {
        id: `fin-sinal-${Date.now()}`,
        tipo: 'receita',
        categoria: 'receita_sinal',
        descricao: `Sinal 50% Pix Inter - ${ag.pacienteNome} (${ag.procedimentoNome})`,
        valor: ag.valorSinal,
        data: new Date().toISOString().split('T')[0],
        formaPagamento: 'pix_inter',
        agendamentoId: ag.id,
        pacienteId: ag.pacienteId,
        pacienteNome: ag.pacienteNome,
        status: 'confirmado',
        comprovanteRef: `INTER-PIX-${Math.floor(100000 + Math.random() * 900000)}`,
        criadoEm: new Date().toISOString(),
      };
      await saveFinanceiroFirestore(tx);
    }
    showToast('Sinal 50% Confirmado!', `Recebimento de R$ ${ag.valorSinal.toFixed(2)} registrado.`, 'success');
  };

  const handleReceberRestanteEConcluir = async (ag: Agendamento) => {
    const updated: Agendamento = {
      ...ag,
      status: 'concluido',
      statusPagamento: 'pago_integral',
      restantePagoEm: new Date().toISOString(),
    };

    // Update in Google Calendar if synced
    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    await saveAgendamentoFirestore(updated);

    if (firebaseUser) {
      const tx: TransacaoFinanceira = {
        id: `fin-restante-${Date.now()}`,
        tipo: 'receita',
        categoria: 'receita_restante',
        descricao: `Quitação 50% pós-atendimento - ${ag.pacienteNome} (${ag.procedimentoNome})`,
        valor: ag.valorRestante,
        data: new Date().toISOString().split('T')[0],
        formaPagamento: 'pix_inter',
        agendamentoId: ag.id,
        pacienteId: ag.pacienteId,
        pacienteNome: ag.pacienteNome,
        status: 'confirmado',
        comprovanteRef: `INTER-POS-${Math.floor(1000 + Math.random() * 9000)}`,
        criadoEm: new Date().toISOString(),
      };
      await saveFinanceiroFirestore(tx);
    }

    showToast(
      'Atendimento Concluído & 50% Quitado!',
      `Recebimento de R$ ${ag.valorRestante.toFixed(2)} registrado no caixa.`,
      'success'
    );
  };

  const handleAtualizarStatusPagamento = async (agendamentoId: string, novoStatus: StatusPagamento) => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return;

    let updated: Agendamento = {
      ...ag,
      statusPagamento: novoStatus,
    };

    if (novoStatus === 'pago_sinal') {
      updated.status = 'sinal_pago';
      updated.sinalPagoEm = updated.sinalPagoEm || new Date().toISOString();
    } else if (novoStatus === 'pago_integral') {
      updated.status = 'concluido';
      updated.sinalPagoEm = updated.sinalPagoEm || new Date().toISOString();
      updated.restantePagoEm = updated.restantePagoEm || new Date().toISOString();
    } else if (novoStatus === 'a_pagar') {
      updated.status = 'aguardando_sinal';
    }

    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    await saveAgendamentoFirestore(updated);
    showToast('Status de Pagamento Atualizado!', `Status alterado para: ${novoStatus.toUpperCase()}`, 'success');
  };

  const handleIniciarEvolucaoAgendamento = (ag: Agendamento) => {
    let pac = pacientes.find((p) => p.id === ag.pacienteId || p.whatsapp === ag.pacienteWhatsapp);
    if (!pac) {
      pac = {
        id: ag.pacienteId || `pac-${Date.now()}`,
        nome: ag.pacienteNome,
        whatsapp: ag.pacienteWhatsapp,
        email: ag.pacienteEmail || '',
        dataNascimento: '',
        profissao: '',
        queixaInicial: ag.observacoes || '',
        historicoMedico: '',
        medicacoesUso: '',
        contraindicacoesAlergias: '',
        nivelAtividadeFisica: 'moderado',
        dataCadastro: new Date().toISOString().split('T')[0],
        totalSessoes: 1,
      };
      savePacienteFirestore(pac);
    }

    setEvolucaoModalData({
      paciente: pac,
      procedimento: ag.procedimentoNome,
    });
  };

  const handleExcluirAgendamento = async (id: string) => {
    const ag = agendamentos.find((a) => a.id === id);
    if (ag && ag.googleEventId) {
      const token = getCachedGoogleAccessToken();
      if (token) {
        excluirEventoGoogleCalendar(ag.googleEventId, token).catch(console.warn);
      }
    }

    await deleteAgendamentoFirestore(id);
    showToast('Agendamento Removido', '', 'info');
  };

  // Handlers: Pacientes & Evoluções
  const handleNovoPaciente = async (novo: Paciente) => {
    await savePacienteFirestore(novo);
    showToast('Paciente Cadastrado!', novo.nome, 'success');
  };

  const handleEditarPaciente = async (atualizado: Paciente) => {
    await savePacienteFirestore(atualizado);
    showToast('Paciente Atualizado!', atualizado.nome, 'success');
  };

  const handleExcluirPaciente = async (id: string) => {
    await deletePacienteFirestore(id);
    const evos = evolucoes.filter((e) => e.pacienteId === id);
    for (const e of evos) {
      await deleteEvolucaoFirestore(e.id);
    }
    showToast('Paciente e Histórico Removidos', '', 'info');
  };

  const handleSalvarEvolucao = async (evo: EvolucaoClinica) => {
    await saveEvolucaoFirestore(evo);

    const pac = pacientes.find((p) => p.id === evo.pacienteId);
    if (pac) {
      const updatedPac: Paciente = {
        ...pac,
        totalSessoes: (pac.totalSessoes || 0) + 1,
        ultimaSessao: evo.dataSessao,
      };
      await savePacienteFirestore(updatedPac);
    }

    setEvolucaoModalData(null);
    showToast('Evolução Clínica Registrada!', 'Relatório emitido e prontuário sincronizado.', 'success');
  };

  const handleExcluirEvolucao = async (id: string) => {
    await deleteEvolucaoFirestore(id);
    showToast('Evolução Removida', '', 'info');
  };

  // Handlers: Procedimentos
  const handleSalvarProcedimento = async (proc: Procedimento) => {
    await saveProcedimentoFirestore(proc);
    showToast('Procedimento Salvo!', `${proc.nome} - R$ ${proc.precoTotal.toFixed(2)}`, 'success');
  };

  const handleExcluirProcedimento = async (id: string) => {
    await deleteProcedimentoFirestore(id);
    showToast('Procedimento Removido', '', 'info');
  };

  // Handlers: Financeiro
  const handleNovaTransacao = async (tx: TransacaoFinanceira) => {
    await saveFinanceiroFirestore(tx);
    showToast('Lançamento Registrado!', `R$ ${tx.valor.toFixed(2)} - ${tx.descricao}`, 'success');
  };

  const handleExcluirTransacao = async (id: string) => {
    await deleteFinanceiroFirestore(id);
    showToast('Transação Removida', '', 'info');
  };

  // Handlers: Usuários de Acesso
  const handleSalvarUsuarioAcesso = async (user: UsuarioTerapeuta) => {
    await saveUsuarioAcesso(user);
    showToast('Permissão Salva!', `Terapeuta ${user.nome} (${user.email}) atualizado.`, 'success');
  };

  const handleExcluirUsuarioAcesso = async (userId: string) => {
    await deleteUsuarioAcesso(userId);
    showToast('Acesso Removido', '', 'info');
  };

  const handleSalvarConfigAcessos = async (config: ConfiguracaoAcessos) => {
    setConfigAcessos(config);
    await saveConfigAcessos(config);
    showToast('Políticas de Acesso Salvas', 'Permissões atualizadas com sucesso.', 'success');
  };

  // Logout
  const handleLogout = async () => {
    await logoutUser();
    setCurrentTerapeuta(null);
    setIsGoogleConnected(false);
    setViewMode('portal_paciente');
    showToast('Sessão Encerrada', 'Você saiu do CRM clínico.', 'info');
  };

  return (
    <>
      {/* 1. VISÃO PÚBLICA: PORTAL DO PACIENTE / AUTO-AGENDAMENTO */}
      {viewMode === 'portal_paciente' && (
        <PortalPacienteView
          procedimentos={procedimentos}
          configClinica={clinica}
          configInter={inter}
          onOpenCRM={() => {
            if (currentTerapeuta) {
              setViewMode('crm_terapeuta');
            } else {
              setModalLoginOpen(true);
            }
          }}
          onOpenLoginTerapeuta={() => {
            if (currentTerapeuta) {
              setViewMode('crm_terapeuta');
            } else {
              setModalLoginOpen(true);
            }
          }}
          onAgendamentoCriado={async (novo) => {
            await handleCriarAgendamento(novo, false);
            showToast('Agendamento Confirmado!', 'Horário reservado e sinal recebido via Banco Inter.', 'success');
          }}
          onShowToast={showToast}
        />
      )}

      {/* 2. VISÃO PRIVADA: CRM CLÍNICO & GESTÃO DA TERAPEUTA */}
      {viewMode === 'crm_terapeuta' && (
        <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900 antialiased">
          {/* Main Topbar & Fullscreen Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            configClinica={clinica}
            configInter={inter}
            pendentesSinalCount={agendamentos.filter((a) => a.status === 'aguardando_sinal' || a.statusPagamento === 'a_pagar').length}
            currentTerapeuta={currentTerapeuta}
            onOpenNovoAgendamento={() => setModalNovoAgendamento(true)}
            onOpenPublicPortal={() => setViewMode('portal_paciente')}
            onLogout={handleLogout}
          />

          {/* Main Content Area (100% da largura útil sem espremer) */}
          <div className="flex-1 w-full min-w-0 overflow-y-auto">
            <main className="w-full max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 pb-24 sm:pb-10">
              {activeTab === 'agendamentos' && (
                <AgendamentosView
                  agendamentos={agendamentos}
                  configClinica={clinica}
                  configInter={inter}
                  isGoogleConnected={isGoogleConnected}
                  onOpenNovoAgendamento={() => setModalNovoAgendamento(true)}
                  onOpenPixModal={(ag) => setAgendamentoPixModal(ag)}
                  onConfirmarSinal={handleConfirmarSinal}
                  onReceberRestanteEConcluir={handleReceberRestanteEConcluir}
                  onAtualizarStatusPagamento={handleAtualizarStatusPagamento}
                  onSincronizarGoogleCalendar={handleSincronizarAgendamentoGoogle}
                  onIniciarEvolucao={handleIniciarEvolucaoAgendamento}
                  onExcluirAgendamento={handleExcluirAgendamento}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'pacientes' && (
                <PacientesCRMView
                  pacientes={pacientes}
                  evolucoes={evolucoes}
                  configClinica={clinica}
                  onNovoPaciente={handleNovoPaciente}
                  onEditarPaciente={handleEditarPaciente}
                  onExcluirPaciente={handleExcluirPaciente}
                  onNovaEvolucao={(paciente) => setEvolucaoModalData({ paciente })}
                  onEditarEvolucao={(evolucao, paciente) => setEvolucaoModalData({ paciente, evolucao })}
                  onExcluirEvolucao={handleExcluirEvolucao}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'financeiro' && (
                <FinanceiroView
                  transacoes={financeiro}
                  configClinica={clinica}
                  configInter={inter}
                  onNovaTransacao={handleNovaTransacao}
                  onExcluirTransacao={handleExcluirTransacao}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'procedimentos' && (
                <ProcedimentosView
                  procedimentos={procedimentos}
                  onSalvarProcedimento={handleSalvarProcedimento}
                  onExcluirProcedimento={handleExcluirProcedimento}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'configuracoes' && (
                <ConfiguracoesView
                  configClinica={clinica}
                  configInter={inter}
                  isGoogleConnected={isGoogleConnected}
                  googleUserEmail={firebaseUser?.email || MASTER_EMAIL}
                  onConectarGoogle={handleConectarGoogle}
                  onSincronizarTodosGoogleCalendar={handleSincronizarTodosGoogle}
                  onSalvarClinica={handleSaveClinica}
                  onSalvarInter={handleSaveInter}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'acessos' && (
                <AcessosView
                  usuarios={usuariosAcesso}
                  configAcessos={configAcessos}
                  onSalvarUsuario={handleSalvarUsuarioAcesso}
                  onExcluirUsuario={handleExcluirUsuarioAcesso}
                  onSalvarConfigAcessos={handleSalvarConfigAcessos}
                  onShowToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Login Terapeuta Modal */}
      <LoginTerapeutaModal
        isOpen={modalLoginOpen}
        currentUser={firebaseUser}
        onClose={() => setModalLoginOpen(false)}
        onLoginSuccess={(usuarioData) => {
          setCurrentTerapeuta(usuarioData);
          setViewMode('crm_terapeuta');
          setModalLoginOpen(false);
        }}
        onShowToast={showToast}
      />

      {/* Modal Novo Agendamento Manual */}
      {modalNovoAgendamento && (
        <NovoAgendamentoModal
          isOpen={modalNovoAgendamento}
          onClose={() => setModalNovoAgendamento(false)}
          procedimentos={procedimentos}
          pacientes={pacientes}
          configInter={inter}
          onCriarAgendamento={handleCriarAgendamento}
          onShowToast={showToast}
        />
      )}

      {/* Modal Link Público Paciente (quando aberto de dentro do CRM) */}
      {modalPublicBooking && (
        <PublicAgendamentoModal
          isOpen={modalPublicBooking}
          onClose={() => setModalPublicBooking(false)}
          procedimentos={procedimentos}
          configClinica={clinica}
          configInter={inter}
          onAgendamentoCriado={async (novo) => {
            await handleCriarAgendamento(novo, false);
            setModalPublicBooking(false);
            showToast('Agendamento Realizado!', `${novo.pacienteNome} - ${novo.procedimentoNome}`, 'success');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Modal Cobrança Pix Inter */}
      {agendamentoPixModal && (
        <PixCobrancaModal
          isOpen={!!agendamentoPixModal}
          onClose={() => setAgendamentoPixModal(null)}
          agendamento={agendamentoPixModal}
          configInter={inter}
          configClinica={clinica}
          onConfirmarPagamento={() => {
            handleConfirmarSinal(agendamentoPixModal.id, 'pix_inter');
            setAgendamentoPixModal(null);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Modal Evolução Clínica & Prontuário */}
      {evolucaoModalData && (
        <EvolucaoModal
          isOpen={!!evolucaoModalData}
          onClose={() => setEvolucaoModalData(null)}
          paciente={evolucaoModalData.paciente}
          evolucaoExistente={evolucaoModalData.evolucao}
          procedimentoSugerido={evolucaoModalData.procedimento}
          configClinica={clinica}
          onSalvarEvolucao={handleSalvarEvolucao}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
