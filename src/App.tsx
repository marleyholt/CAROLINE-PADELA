import React, { useState, useEffect, useCallback } from 'react';
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
  PacoteSessoes,
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
import { LandingPageView } from './components/LandingPageView';
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
  subscribePacotesSessoes,
  savePacoteSessoesFirestore,
  deletePacoteSessoesFirestore,
} from './services/firebase';
import {
  extrairParametrosRetornoInfinitePay,
  verificarPagamentoInfinitePay,
} from './services/infinitePay';
import {
  criarEventoGoogleCalendar,
  atualizarEventoGoogleCalendar,
  excluirEventoGoogleCalendar,
  sincronizarAgendamentosEmMassa,
} from './services/googleCalendar';
import { User } from 'firebase/auth';

export default function App() {
  // Mode: Home Landing Page, Patient Portal or Therapist CRM
  const [viewMode, setViewMode] = useState<'home' | 'portal_paciente' | 'crm_terapeuta'>('home');
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
  const [pacotesSessoes, setPacotesSessoes] = useState<PacoteSessoes[]>(StorageService.getPacotes());
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

  // Toast Notifications (Desaparece automaticamente após 3 segundos)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message: string = '', type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss após 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
          setCurrentTerapeuta((prev) => {
            if (prev?.email === userEmail && prev?.role === 'master') {
              return prev;
            }
            return {
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
          });
        } else {
          // Checa na lista atual sem disparar re-render circular
          setUsuariosAcesso((currentList) => {
            const found = currentList.find((u) => u.email.toLowerCase().trim() === userEmail);
            if (found && found.ativo) {
              setCurrentTerapeuta((prev) => (prev?.id === found.id ? prev : found));
            }
            return currentList;
          });
        }
      } else {
        // Se usuário deslogou do Firebase
        setCurrentTerapeuta((prev) => {
          if (prev?.role === 'master') return prev;
          setIsGoogleConnected(false);
          return null;
        });
      }
    });

    return () => unsubAuth();
  }, []);

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
      if (items.length > 0) {
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
  }, []);

  // 3. Real-time Authenticated CRM Sync (Pacientes, Evoluções, Financeiro, Usuários, Pacotes)
  useEffect(() => {
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

    const unsubPacotes = subscribePacotesSessoes((items) => {
      setPacotesSessoes(items);
      StorageService.savePacotes(items);
    });

    return () => {
      unsubPacientes();
      unsubEvolucoes();
      unsubFinanceiro();
      unsubUsuarios();
      unsubPacotes();
    };
  }, []);

  // 4. Detecção e Verificação de Retorno do Checkout InfinitePay (Redirect Webhook)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const retorno = extrairParametrosRetornoInfinitePay(window.location.search);
      if (!retorno || (!retorno.orderNsu && !retorno.slug && retorno.status !== 'retorno_infinitepay')) {
        return;
      }

      const processarRetornoInfinitePay = async () => {
        const agId = retorno.orderNsu;
        const ag = agendamentos.find((a) => (agId && a.id === agId) || (retorno.slug && a.slugPagamento === retorno.slug));

        if (ag && ag.status !== 'sinal_pago') {
          let confirmado = true;
          if (inter?.infiniteTag && (retorno.slug || retorno.orderNsu)) {
            try {
              const check = await verificarPagamentoInfinitePay({
                handle: inter.infiniteTag,
                orderNsu: retorno.orderNsu,
                slug: retorno.slug,
              });
              if (check && check.pago !== undefined) {
                confirmado = check.pago;
              }
            } catch (e) {
              console.warn('Verificação InfinitePay:', e);
            }
          }

          if (confirmado) {
            const updated: Agendamento = {
              ...ag,
              status: 'sinal_pago',
              statusPagamento: 'pago_sinal',
              metodoSinal: 'pix_infinitepay',
              transactionNsu: retorno.transactionNsu,
              slugPagamento: retorno.slug,
              receiptUrl: retorno.receiptUrl,
              sinalPagoEm: new Date().toISOString(),
            };

            // Salva agendamento confirmado
            await saveAgendamentoFirestore(updated);

            // Registra receita de 50% do sinal no Financeiro
            const tx: TransacaoFinanceira = {
              id: `fin-sinal-${Date.now()}`,
              tipo: 'receita',
              categoria: 'receita_sinal',
              descricao: `Sinal 50% InfinitePay - ${ag.pacienteNome} (${ag.procedimentoNome})`,
              valor: ag.valorSinal,
              data: new Date().toISOString().split('T')[0],
              formaPagamento: 'pix_infinitepay',
              agendamentoId: ag.id,
              pacienteId: ag.pacienteId,
              pacienteNome: ag.pacienteNome,
              status: 'confirmado',
              comprovanteRef: retorno.transactionNsu || `INFPAY-${Date.now()}`,
              criadoEm: new Date().toISOString(),
            };
            await saveFinanceiroFirestore(tx);

            showToast('Pagamento Confirmado na InfinitePay!', `Sinal de R$ ${ag.valorSinal.toFixed(2)} recebido. Horário de ${ag.pacienteNome} garantido!`, 'success');
          }
        }

        // Limpa os parâmetros de busca da URL para não reexecutar em recarregamentos
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}
      };

      if (agendamentos.length > 0) {
        processarRetornoInfinitePay();
      }
    } catch (err) {
      console.warn('Erro ao processar retorno InfinitePay:', err);
    }
  }, [agendamentos, inter, showToast]);

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

    // Helper para comparar telefones sem caracteres especiais
    const cleanPhone = (val?: string) => (val || '').replace(/\D/g, '');
    const searchPhone = cleanPhone(novo.pacienteWhatsapp);

    // 1. Verificar se o paciente já está cadastrado no CRM
    const existingPac = pacientes.find((p) =>
      (novo.pacienteId && novo.pacienteId !== 'novo' && p.id === novo.pacienteId) ||
      (searchPhone && cleanPhone(p.whatsapp) === searchPhone) ||
      (novo.pacienteNome && p.nome.trim().toLowerCase() === novo.pacienteNome.trim().toLowerCase())
    );

    let targetPacienteId = novo.pacienteId;
    let targetPacienteNome = novo.pacienteNome;

    if (existingPac) {
      // Paciente já existe: NÃO duplicar no CRM! Vincular com os dados existentes
      targetPacienteId = existingPac.id;
      targetPacienteNome = existingPac.nome;
      agendamentoFinal.pacienteId = existingPac.id;
      agendamentoFinal.pacienteNome = existingPac.nome;
      agendamentoFinal.pacienteWhatsapp = existingPac.whatsapp;
      if (!agendamentoFinal.pacienteEmail && existingPac.email) {
        agendamentoFinal.pacienteEmail = existingPac.email;
      }

      // Atualiza total de sessões e data no cadastro do paciente existente
      const updatedPac: Paciente = {
        ...existingPac,
        totalSessoes: (existingPac.totalSessoes || 0) + 1,
        ultimaSessao: agendamentoFinal.data,
      };
      const listaPac = pacientes.map((p) => (p.id === updatedPac.id ? updatedPac : p));
      setPacientes(listaPac);
      StorageService.savePacientes(listaPac);
      if (firebaseUser) {
        await savePacienteFirestore(updatedPac);
      }
    } else {
      // Paciente novo: Cadastrar no CRM
      const novoPacId = novo.pacienteId && novo.pacienteId !== 'novo' ? novo.pacienteId : `pac-${Date.now()}`;
      targetPacienteId = novoPacId;
      agendamentoFinal.pacienteId = novoPacId;

      const novoPac: Paciente = {
        id: novoPacId,
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
        ultimaSessao: agendamentoFinal.data,
      };

      const listaPac = [novoPac, ...pacientes.filter((p) => p.id !== novoPac.id)];
      setPacientes(listaPac);
      StorageService.savePacientes(listaPac);
      if (firebaseUser) {
        await savePacienteFirestore(novoPac);
      }
    }

    // 2. Salvar o agendamento no Estado Local, Storage e Firestore
    const listaAgendamentos = [agendamentoFinal, ...agendamentos.filter((a) => a.id !== agendamentoFinal.id)];
    setAgendamentos(listaAgendamentos);
    StorageService.saveAgendamentos(listaAgendamentos);
    if (firebaseUser) {
      await saveAgendamentoFirestore(agendamentoFinal);
    }

    // 3. Inserir uma nova sessão (Evolução / Prontuário) com marcação de "Pendente de Relatório / Ainda vai acontecer"
    const novaSessaoPendente: EvolucaoClinica = {
      id: `evo-ag-${agendamentoFinal.id}`,
      pacienteId: targetPacienteId,
      agendamentoId: agendamentoFinal.id,
      dataSessao: agendamentoFinal.data,
      horario: agendamentoFinal.horario,
      procedimentoRealizado: agendamentoFinal.procedimentoNome,
      terapeutaResponsavel: clinica.nomeTerapeuta || 'Caroline Padela',
      statusRelatorio: 'pendente', // Marcador visual de sessão agendada que aguarda conclusão do relatório
      evaInicial: 0,
      evaFinal: 0,
      regioesTrabalhadas: [],
      queixaPrincipal: agendamentoFinal.observacoes || 'Sessão agendada no sistema.',
      manobrasAplicadas: '',
      reacaoTecidual: '',
      orientacoesCasa: '',
      observacoesGerais: `Sessão agendada para ${agendamentoFinal.data} às ${agendamentoFinal.horario}. Lembrete: Concluir a evolução e relatório clínico após o atendimento.`,
      valorPago: agendamentoFinal.valorTotal,
      formaPagamento: (agendamentoFinal.metodoSinal as any) || 'pix_infinitepay',
      lancarFinanceiro: false,
      criadoEm: new Date().toISOString(),
    };

    const listaEvos = [
      novaSessaoPendente,
      ...evolucoes.filter((e) => e.id !== novaSessaoPendente.id && e.agendamentoId !== agendamentoFinal.id),
    ];
    setEvolucoes(listaEvos);
    StorageService.saveEvolucoes(listaEvos);
    if (firebaseUser) {
      await saveEvolucaoFirestore(novaSessaoPendente);
    }

    // 4. Se for agendamento de PACOTE: Inserir diretamente na aba de Controle de Pacotes e nas Movimentações Financeiras
    const procAgendado = procedimentos.find(
      (p) => p.id === agendamentoFinal.procedimentoId || p.nome.toLowerCase() === agendamentoFinal.procedimentoNome.toLowerCase()
    );
    const isPacote =
      procAgendado?.tipo === 'pacote' ||
      (procAgendado?.quantidadeSessoes && procAgendado.quantidadeSessoes > 1) ||
      agendamentoFinal.procedimentoNome.toLowerCase().includes('pacote');

    if (isPacote) {
      const totalSessoesPacote = procAgendado?.quantidadeSessoes || 8;
      const pacoteId = `pacote-ag-${agendamentoFinal.id}`;
      const valorJaPago = agendamentoFinal.statusPagamento === 'pago_integral' 
        ? agendamentoFinal.valorTotal 
        : (agendamentoFinal.statusPagamento === 'pago_sinal' ? agendamentoFinal.valorSinal : 0);

      const novoPacote: PacoteSessoes = {
        id: pacoteId,
        pacienteId: targetPacienteId,
        pacienteNome: targetPacienteNome,
        pacienteWhatsapp: agendamentoFinal.pacienteWhatsapp,
        procedimentoId: procAgendado?.id || agendamentoFinal.procedimentoId,
        procedimentoNome: agendamentoFinal.procedimentoNome,
        totalSessoes: totalSessoesPacote,
        sessoesRealizadas: 0,
        valorTotal: agendamentoFinal.valorTotal,
        valorPago: valorJaPago,
        statusPagamento: valorJaPago >= agendamentoFinal.valorTotal ? 'pago_integral' : (valorJaPago > 0 ? 'parcial' : 'pendente'),
        status: 'ativo',
        historicoRealizacoes: [],
        dataContratacao: agendamentoFinal.data,
        observacoes: agendamentoFinal.observacoes || `Pacote agendado para ${agendamentoFinal.data} às ${agendamentoFinal.horario}`,
        criadoEm: new Date().toISOString(),
      };

      const listaPacotes = [novoPacote, ...pacotesSessoes.filter((p) => p.id !== novoPacote.id)];
      setPacotesSessoes(listaPacotes);
      StorageService.savePacotes(listaPacotes);
      if (firebaseUser) {
        await savePacoteSessoesFirestore(novoPacote);
      }

      // Adiciona lançamento na aba de movimentações financeiras
      if (valorJaPago > 0) {
        const txPacote: TransacaoFinanceira = {
          id: `fin-pacote-${agendamentoFinal.id}`,
          tipo: 'receita',
          categoria: 'receita_pacote',
          categoriaNome: `Pacote ${totalSessoesPacote}x ${agendamentoFinal.procedimentoNome}`,
          descricao: `Venda de Pacote ${totalSessoesPacote} Sessões - ${targetPacienteNome}`,
          valor: valorJaPago,
          data: agendamentoFinal.data,
          formaPagamento: (agendamentoFinal.metodoSinal as any) || 'pix_infinitepay',
          pacienteId: targetPacienteId,
          pacienteNome: targetPacienteNome,
          pacoteId: novoPacote.id,
          status: 'confirmado',
          criadoEm: new Date().toISOString(),
        };

        const listaFin = [txPacote, ...financeiro.filter((f) => f.id !== txPacote.id)];
        setFinanceiro(listaFin);
        StorageService.saveFinanceiro(listaFin);
        if (firebaseUser) {
          await saveFinanceiroFirestore(txPacote);
        }
      }
    }

    setModalNovoAgendamento(false);

    if (abrirPix) {
      setAgendamentoPixModal(agendamentoFinal);
    } else {
      if (existingPac) {
        showToast(
          'Agendamento Registrado!',
          `Paciente existente (${targetPacienteNome}): Nova sessão agendada e adicionada ao prontuário.`,
          'success'
        );
      } else {
        showToast('Agendamento Criado!', `${targetPacienteNome} - ${agendamentoFinal.procedimentoNome}`, 'success');
      }
    }
  };

  const handleConfirmarSinal = async (agendamentoId: string, metodo: 'pix_infinitepay' | 'pix_inter' | 'cartao_credito' | 'dinheiro' = 'pix_inter') => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return;

    const updated: Agendamento = {
      ...ag,
      status: 'confirmado',
      statusPagamento: 'pago_sinal',
      metodoSinal: metodo,
      sinalPagoEm: new Date().toISOString(),
    };

    // Atualiza estado local imediatamente
    const listaAg = agendamentos.map((a) => (a.id === agendamentoId ? updated : a));
    setAgendamentos(listaAg);
    StorageService.saveAgendamentos(listaAg);

    // Update in Google Calendar if synced
    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    if (firebaseUser) {
      await saveAgendamentoFirestore(updated);
    }

    // Register financial transaction (50% signal)
    const tx: TransacaoFinanceira = {
      id: `fin-sinal-${Date.now()}`,
      tipo: 'receita',
      categoria: 'receita_sinal',
      descricao: `Sinal 50% Pix - ${ag.pacienteNome} (${ag.procedimentoNome})`,
      valor: ag.valorSinal,
      data: new Date().toISOString().split('T')[0],
      formaPagamento: metodo,
      agendamentoId: ag.id,
      pacienteId: ag.pacienteId,
      pacienteNome: ag.pacienteNome,
      status: 'confirmado',
      comprovanteRef: `PIX-SINAL-${Math.floor(100000 + Math.random() * 900000)}`,
      criadoEm: new Date().toISOString(),
    };

    const listaFin = [tx, ...financeiro.filter((f) => f.id !== tx.id)];
    setFinanceiro(listaFin);
    StorageService.saveFinanceiro(listaFin);
    if (firebaseUser) {
      await saveFinanceiroFirestore(tx);
    }

    showToast('Sinal 50% Confirmado!', `Recebimento de R$ ${ag.valorSinal.toFixed(2)} registrado na agenda e no financeiro.`, 'success');
  };

  const handleConfirmarPagamentoIntegral = async (agendamentoId: string, metodo: 'pix_infinitepay' | 'pix_inter' | 'cartao_credito' | 'dinheiro' = 'pix_inter') => {
    const ag = agendamentos.find((a) => a.id === agendamentoId);
    if (!ag) return;

    const valorTotal = ag.valorTotal || (ag.valorSinal + ag.valorRestante);

    const updated: Agendamento = {
      ...ag,
      status: 'confirmado',
      statusPagamento: 'pago_integral',
      metodoSinal: metodo,
      sinalPagoEm: ag.sinalPagoEm || new Date().toISOString(),
      restantePagoEm: new Date().toISOString(),
    };

    // Atualiza estado local imediatamente
    const listaAg = agendamentos.map((a) => (a.id === agendamentoId ? updated : a));
    setAgendamentos(listaAg);
    StorageService.saveAgendamentos(listaAg);

    // Update in Google Calendar if synced
    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    if (firebaseUser) {
      await saveAgendamentoFirestore(updated);
    }

    // Register financial transaction (100% integral)
    const tx: TransacaoFinanceira = {
      id: `fin-integral-${Date.now()}`,
      tipo: 'receita',
      categoria: 'receita_procedimento',
      descricao: `Pagamento Integral (100%) - ${ag.pacienteNome} (${ag.procedimentoNome})`,
      valor: valorTotal,
      data: new Date().toISOString().split('T')[0],
      formaPagamento: metodo,
      agendamentoId: ag.id,
      pacienteId: ag.pacienteId,
      pacienteNome: ag.pacienteNome,
      status: 'confirmado',
      comprovanteRef: `PAG-INT-${Math.floor(100000 + Math.random() * 900000)}`,
      criadoEm: new Date().toISOString(),
    };

    const listaFin = [tx, ...financeiro.filter((f) => f.id !== tx.id)];
    setFinanceiro(listaFin);
    StorageService.saveFinanceiro(listaFin);
    if (firebaseUser) {
      await saveFinanceiroFirestore(tx);
    }

    showToast('Pagamento Integral Confirmado!', `Recebimento total de R$ ${valorTotal.toFixed(2)} registrado com sucesso no financeiro.`, 'success');
  };

  const handleReceberRestanteEConcluir = async (ag: Agendamento) => {
    const updated: Agendamento = {
      ...ag,
      status: 'concluido',
      statusPagamento: 'pago_integral',
      restantePagoEm: new Date().toISOString(),
    };

    // Atualiza estado local imediatamente
    const listaAg = agendamentos.map((a) => (a.id === ag.id ? updated : a));
    setAgendamentos(listaAg);
    StorageService.saveAgendamentos(listaAg);

    // Update in Google Calendar if synced
    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    if (firebaseUser) {
      await saveAgendamentoFirestore(updated);
    }

    // Se ainda havia valor restante pendente a receber
    if (ag.valorRestante > 0) {
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

      const listaFin = [tx, ...financeiro.filter((f) => f.id !== tx.id)];
      setFinanceiro(listaFin);
      StorageService.saveFinanceiro(listaFin);
      if (firebaseUser) {
        await saveFinanceiroFirestore(tx);
      }
    }

    showToast(
      'Atendimento Concluído & Quitado!',
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
      updated.status = 'confirmado';
      updated.sinalPagoEm = updated.sinalPagoEm || new Date().toISOString();
    } else if (novoStatus === 'pago_integral') {
      updated.status = 'concluido';
      updated.sinalPagoEm = updated.sinalPagoEm || new Date().toISOString();
      updated.restantePagoEm = updated.restantePagoEm || new Date().toISOString();
    } else if (novoStatus === 'a_pagar') {
      updated.status = 'aguardando_sinal';
    }

    const listaAg = agendamentos.map((a) => (a.id === agendamentoId ? updated : a));
    setAgendamentos(listaAg);
    StorageService.saveAgendamentos(listaAg);

    const token = getCachedGoogleAccessToken();
    if (token && updated.googleEventId) {
      atualizarEventoGoogleCalendar(updated, clinica, token).catch(console.warn);
    }

    if (firebaseUser) {
      await saveAgendamentoFirestore(updated);
    }
    showToast('Status de Pagamento Atualizado!', `Status alterado para: ${novoStatus.toUpperCase()}`, 'success');
  };

  const handleIniciarEvolucaoAgendamento = (ag: Agendamento) => {
    const cleanPhone = (val?: string) => (val || '').replace(/\D/g, '');
    const agPhoneClean = cleanPhone(ag.pacienteWhatsapp);

    let pac = pacientes.find(
      (p) =>
        p.id === ag.pacienteId ||
        (agPhoneClean && cleanPhone(p.whatsapp) === agPhoneClean) ||
        (ag.pacienteNome && p.nome.trim().toLowerCase() === ag.pacienteNome.trim().toLowerCase())
    );

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

    // Localizar sessão/evolução pendente associada a este agendamento
    const existingEvo = evolucoes.find(
      (e) =>
        (ag.id && (e.agendamentoId === ag.id || e.id === `evo-ag-${ag.id}`)) ||
        (e.pacienteId === pac?.id && e.dataSessao === ag.data)
    );

    setEvolucaoModalData({
      paciente: pac,
      procedimento: ag.procedimentoNome,
      evolucao: existingEvo,
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

    // Atualiza imediatamente o estado local e localStorage
    const listaAtualizada = agendamentos.filter((a) => a.id !== id);
    setAgendamentos(listaAtualizada);
    StorageService.saveAgendamentos(listaAtualizada);

    // Remove do Firestore se estiver conectado
    if (firebaseUser) {
      await deleteAgendamentoFirestore(id);
    }

    // Se houver evolução pendente criada para este agendamento, remove também
    const evoPendente = evolucoes.find((e) => e.agendamentoId === id || e.id === `evo-ag-${id}`);
    if (evoPendente && evoPendente.statusRelatorio === 'pendente') {
      const listaEvos = evolucoes.filter((e) => e.id !== evoPendente.id);
      setEvolucoes(listaEvos);
      StorageService.saveEvolucoes(listaEvos);
      if (firebaseUser) {
        await deleteEvolucaoFirestore(evoPendente.id);
      }
    }

    showToast('Agendamento Removido com Sucesso', 'O horário foi liberado na agenda.', 'info');
  };

  // Handlers: Pacientes & Evoluções
  const handleNovoPaciente = async (novo: Paciente) => {
    const lista = [novo, ...pacientes.filter((p) => p.id !== novo.id)];
    setPacientes(lista);
    StorageService.savePacientes(lista);
    await savePacienteFirestore(novo);
    showToast('Paciente Cadastrado!', novo.nome, 'success');
  };

  const handleEditarPaciente = async (atualizado: Paciente) => {
    const lista = pacientes.map((p) => (p.id === atualizado.id ? atualizado : p));
    setPacientes(lista);
    StorageService.savePacientes(lista);
    await savePacienteFirestore(atualizado);
    showToast('Paciente Atualizado!', atualizado.nome, 'success');
  };

  const handleExcluirPaciente = async (id: string) => {
    const lista = pacientes.filter((p) => p.id !== id);
    setPacientes(lista);
    StorageService.savePacientes(lista);
    await deletePacienteFirestore(id);
    const evos = evolucoes.filter((e) => e.pacienteId === id);
    for (const e of evos) {
      await deleteEvolucaoFirestore(e.id);
    }
    showToast('Paciente e Histórico Removidos', '', 'info');
  };

  const handleSalvarEvolucao = async (evo: EvolucaoClinica) => {
    // Ao salvar, a evolução é marcada como relatório concluído
    const evoConcluida: EvolucaoClinica = {
      ...evo,
      statusRelatorio: 'concluido',
    };

    const listaEvos = [evoConcluida, ...evolucoes.filter((e) => e.id !== evoConcluida.id)];
    setEvolucoes(listaEvos);
    StorageService.saveEvolucoes(listaEvos);
    await saveEvolucaoFirestore(evoConcluida);

    const pac = pacientes.find((p) => p.id === evoConcluida.pacienteId);
    if (pac) {
      const updatedPac: Paciente = {
        ...pac,
        ultimaSessao: evoConcluida.dataSessao,
      };
      const listaPac = pacientes.map((p) => (p.id === updatedPac.id ? updatedPac : p));
      setPacientes(listaPac);
      StorageService.savePacientes(listaPac);
      await savePacienteFirestore(updatedPac);
    }

    // Se o usuário optou por lançar o valor pago no financeiro automaticamente
    if (evo.lancarFinanceiro && evo.valorPago && evo.valorPago > 0) {
      const formaPagto = (evo.formaPagamento === 'pix_inter' || evo.formaPagamento === 'dinheiro' || evo.formaPagamento === 'cartao_credito' || evo.formaPagamento === 'cartao_debito' || evo.formaPagamento === 'transferencia' || evo.formaPagamento === 'boleto')
        ? (evo.formaPagamento as any)
        : 'pix_inter';

      const transacaoFinanceira: TransacaoFinanceira = {
        id: `trans-${Date.now()}`,
        tipo: 'receita',
        categoria: 'receita_sessao_avulsa',
        categoriaNome: `Sessão: ${evo.procedimentoRealizado}`,
        descricao: `Sessão de ${evo.procedimentoRealizado} - Paciente ${pac?.nome || 'Paciente'}`,
        valor: evo.valorPago,
        data: evo.dataSessao,
        formaPagamento: formaPagto,
        pacienteId: evo.pacienteId,
        pacienteNome: pac?.nome,
        status: 'confirmado',
        criadoEm: new Date().toISOString(),
      };

      const listaFinanceiro = [transacaoFinanceira, ...financeiro.filter((f) => f.id !== transacaoFinanceira.id)];
      setFinanceiro(listaFinanceiro);
      StorageService.saveFinanceiro(listaFinanceiro);
      await saveFinanceiroFirestore(transacaoFinanceira);
    }

    setEvolucaoModalData(null);
    showToast('Sessão & Prontuário Salvos!', 'Relatório emitido e prontuário sincronizado.', 'success');
  };

  const handleExcluirEvolucao = async (id: string) => {
    const lista = evolucoes.filter((e) => e.id !== id);
    setEvolucoes(lista);
    StorageService.saveEvolucoes(lista);
    await deleteEvolucaoFirestore(id);
    showToast('Evolução Removida', '', 'info');
  };

  // Handlers: Procedimentos
  const handleSalvarProcedimento = async (proc: Procedimento) => {
    const lista = [proc, ...procedimentos.filter((p) => p.id !== proc.id)];
    setProcedimentos(lista);
    StorageService.saveProcedimentos(lista);
    await saveProcedimentoFirestore(proc);
    showToast('Procedimento Salvo!', `${proc.nome} - R$ ${proc.precoTotal.toFixed(2)}`, 'success');
  };

  const handleExcluirProcedimento = async (id: string) => {
    const lista = procedimentos.filter((p) => p.id !== id);
    setProcedimentos(lista);
    StorageService.saveProcedimentos(lista);
    await deleteProcedimentoFirestore(id);
    showToast('Procedimento Removido', '', 'info');
  };

  // Handlers: Financeiro
  const handleNovaTransacao = async (tx: TransacaoFinanceira) => {
    await saveFinanceiroFirestore(tx);
    const lista = [tx, ...financeiro.filter((t) => t.id !== tx.id)];
    setFinanceiro(lista);
    StorageService.saveFinanceiro(lista);
    showToast('Lançamento Registrado!', `R$ ${tx.valor.toFixed(2)} - ${tx.descricao}`, 'success');
  };

  const handleExcluirTransacao = async (id: string) => {
    await deleteFinanceiroFirestore(id);
    const lista = financeiro.filter((t) => t.id !== id);
    setFinanceiro(lista);
    StorageService.saveFinanceiro(lista);
    showToast('Transação Removida', '', 'info');
  };

  // Handlers: Pacotes de Sessões
  const handleNovoPacote = async (pacote: PacoteSessoes) => {
    await savePacoteSessoesFirestore(pacote);
    const lista = [pacote, ...pacotesSessoes.filter((p) => p.id !== pacote.id)];
    setPacotesSessoes(lista);
    StorageService.savePacotes(lista);
  };

  const handleAtualizarPacote = async (pacote: PacoteSessoes) => {
    await savePacoteSessoesFirestore(pacote);
    const lista = pacotesSessoes.map((p) => (p.id === pacote.id ? pacote : p));
    setPacotesSessoes(lista);
    StorageService.savePacotes(lista);
  };

  const handleExcluirPacote = async (pacoteId: string) => {
    await deletePacoteSessoesFirestore(pacoteId);
    const lista = pacotesSessoes.filter((p) => p.id !== pacoteId);
    setPacotesSessoes(lista);
    StorageService.savePacotes(lista);
    showToast('Pacote Removido', '', 'info');
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
      {/* 1. VISÃO INSTITUCIONAL: PÁGINA INICIAL / LANDING PAGE CAROLINE PADELA */}
      {viewMode === 'home' && (
        <LandingPageView
          configClinica={clinica}
          procedimentos={procedimentos}
          onIrParaAgendamento={() => setViewMode('portal_paciente')}
          onIrParaCRM={() => {
            if (currentTerapeuta) {
              setViewMode('crm_terapeuta');
            } else {
              setModalLoginOpen(true);
            }
          }}
        />
      )}

      {/* 2. VISÃO PÚBLICA: PORTAL DO PACIENTE / AUTO-AGENDAMENTO */}
      {viewMode === 'portal_paciente' && (
        <PortalPacienteView
          procedimentos={procedimentos}
          configClinica={clinica}
          configInter={inter}
          onVoltarHome={() => setViewMode('home')}
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

      {/* 3. VISÃO PRIVADA: CRM CLÍNICO & GESTÃO DA TERAPEUTA */}
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
            onOpenPublicPortal={() => setViewMode('home')}
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
                  onSalvarClinica={handleSaveClinica}
                  onOpenNovoAgendamento={() => setModalNovoAgendamento(true)}
                  onOpenPixModal={(ag) => setAgendamentoPixModal(ag)}
                  onConfirmarSinal={handleConfirmarSinal}
                  onConfirmarPagamentoIntegral={handleConfirmarPagamentoIntegral}
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
                  procedimentos={procedimentos}
                  configClinica={clinica}
                  onNovoPaciente={handleNovoPaciente}
                  onEditarPaciente={handleEditarPaciente}
                  onExcluirPaciente={handleExcluirPaciente}
                  onAdicionarSessao={(paciente) => setEvolucaoModalData({ paciente })}
                  onAbrirNovaEvolucao={(paciente) => setEvolucaoModalData({ paciente })}
                  onNovaEvolucao={(paciente) => setEvolucaoModalData({ paciente })}
                  onEditarEvolucao={(evolucao, paciente) => setEvolucaoModalData({ paciente, evolucao })}
                  onExcluirEvolucao={handleExcluirEvolucao}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'financeiro' && (
                <FinanceiroView
                  transacoes={financeiro}
                  procedimentos={procedimentos}
                  pacientes={pacientes}
                  pacotesSessoes={pacotesSessoes}
                  configClinica={clinica}
                  configInter={inter}
                  onNovaTransacao={handleNovaTransacao}
                  onExcluirTransacao={handleExcluirTransacao}
                  onNovoPacote={handleNovoPacote}
                  onAtualizarPacote={handleAtualizarPacote}
                  onExcluirPacote={handleExcluirPacote}
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
          configClinica={clinica}
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
          procedimentos={procedimentos}
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
