import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInfinitePay,
  ConfiguracaoInter,
  EvolucaoClinica,
  Paciente,
  Procedimento,
  TransacaoFinanceira,
  PacoteSessoes,
} from '../types';

const STORAGE_KEYS = {
  CLINICA: 'masso_clinica_config',
  INFINITEPAY: 'masso_infinitepay_config',
  INTER: 'masso_inter_config',
  PROCEDIMENTOS: 'masso_procedimentos',
  PACIENTES: 'masso_pacientes',
  EVOLUCOES: 'masso_evolucoes',
  AGENDAMENTOS: 'masso_agendamentos',
  FINANCEIRO: 'masso_financeiro',
  PACOTES: 'masso_pacotes',
};

export const DEFAULT_CLINICA: ConfiguracaoClinica = {
  nomeClinica: 'Caroline Padela - Liberação Miofascial & Massoterapia',
  nomeTerapeuta: 'Caroline Padela',
  registroProfissional: 'Massoterapeuta & Terapeuta Corporal',
  especialidade: 'Liberação Miofascial • Massagem • Ventosaterapia • Drenagem Linfática',
  whatsapp: '5521975134597',
  email: 'contato@carolinepadela.com.br',
  telefone: '(21) 97513-4597',
  instagram: '@carolpadela',
  endereco: 'R. Barão de Inoa, 58 - Sobreloja - Centro',
  cidadeUf: 'Maricá - RJ',
  cnpjCpf: '',
  logoUrl: '',
  assinaturaUrl: '',
  assinaturaBgColor: '#EDF1EB',
  textoMarcaDagua: 'CAROLINE PADELA • LIBERAÇÃO MIOFASCIAL & MASSOTERAPIA',
  mensagemWhatsappPadrao: 'Olá {nome}! Aqui é a Caroline Padela. Segue o seu relatório de evolução da nossa sessão com as orientações de autocuidado. Qualquer dúvida estou à disposição!',
  diasSemanaDisponiveis: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  horariosDisponiveis: ['08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'],
  intervaloMinutos: 75,
};

export const DEFAULT_INFINITEPAY: ConfiguracaoInfinitePay = {
  chavePix: '5521975134597',
  tipoChavePix: 'telefone',
  nomeTitular: 'CAROLINE PADELA',
  cidadeTitular: 'MARICA',
  infiniteTag: 'caroline-padela',
  linkPagamento: 'https://infinitepay.io/pay/caroline-padela',
  apiKey: '',
  ambiente: 'producao',
  webhookAtivo: true,
};

export const DEFAULT_INTER = DEFAULT_INFINITEPAY;

export const DEFAULT_PROCEDIMENTOS: Procedimento[] = [
  {
    id: 'proc-1',
    nome: 'Massagem Relaxante com Aromaterapia',
    categoria: 'massoterapia',
    tipo: 'avulso',
    quantidadeSessoes: 1,
    duracaoMinutos: 60,
    precoTotal: 160,
    sinalPercentual: 50,
    valorSinal: 80,
    descricao: 'Manobras suaves e envolventes com óleos essenciais para redução profunda de estresse e tensão muscular.',
    corTag: '#10b981',
    ativo: true,
  },
  {
    id: 'proc-2',
    nome: 'Massagem Terapêutica & Liberação Miofascial',
    categoria: 'massoterapia',
    tipo: 'avulso',
    quantidadeSessoes: 1,
    duracaoMinutos: 60,
    precoTotal: 190,
    sinalPercentual: 50,
    valorSinal: 95,
    descricao: 'Terapia focada em desativação de pontos-gatilho (trigger points), contraturas crônicas e alívio de dores.',
    corTag: '#0ea5e9',
    ativo: true,
  },
  {
    id: 'proc-3',
    nome: 'Drenagem Linfática Manual (Método Vodder)',
    categoria: 'massoterapia',
    tipo: 'avulso',
    quantidadeSessoes: 1,
    duracaoMinutos: 60,
    precoTotal: 180,
    sinalPercentual: 50,
    valorSinal: 90,
    descricao: 'Estimulação do sistema linfático para redução de edemas, retenção hídrica e melhora da circulação.',
    corTag: '#8b5cf6',
    ativo: true,
  },
  {
    id: 'proc-4',
    nome: 'Ventosaterapia Integrativa & Terapia Manual',
    categoria: 'terapia_manual',
    tipo: 'avulso',
    quantidadeSessoes: 1,
    duracaoMinutos: 50,
    precoTotal: 150,
    sinalPercentual: 50,
    valorSinal: 75,
    descricao: 'Aplicação de ventosas para oxigenação tecidual, descolamento de fáscia e relaxamento muscular.',
    corTag: '#f59e0b',
    ativo: true,
  },
  {
    id: 'proc-5',
    nome: 'Pacote Terapêutico Alívio da Dor (8 Sessões)',
    categoria: 'massoterapia',
    tipo: 'pacote',
    quantidadeSessoes: 8,
    duracaoMinutos: 60,
    precoTotal: 1200,
    sinalPercentual: 50,
    valorSinal: 600,
    descricao: 'Tratamento intensivo de 8 sessões para desativação crônica de pontos-gatilho e reabilitação postural.',
    corTag: '#6366f1',
    ativo: true,
  },
];

export const DEFAULT_PACIENTES: Paciente[] = [];
export const DEFAULT_EVOLUCOES: EvolucaoClinica[] = [];
export const DEFAULT_AGENDAMENTOS: Agendamento[] = [];
export const DEFAULT_FINANCEIRO: TransacaoFinanceira[] = [];

// Storage accessor functions with automatic hydration
export const StorageService = {
  getClinica: (): ConfiguracaoClinica => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLINICA);
      return data ? JSON.parse(data) : DEFAULT_CLINICA;
    } catch {
      return DEFAULT_CLINICA;
    }
  },

  saveClinica: (config: ConfiguracaoClinica): void => {
    localStorage.setItem(STORAGE_KEYS.CLINICA, JSON.stringify(config));
  },

  getInfinitePay: (): ConfiguracaoInfinitePay => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INFINITEPAY) || localStorage.getItem(STORAGE_KEYS.INTER);
      return data ? JSON.parse(data) : DEFAULT_INFINITEPAY;
    } catch {
      return DEFAULT_INFINITEPAY;
    }
  },

  saveInfinitePay: (config: ConfiguracaoInfinitePay): void => {
    localStorage.setItem(STORAGE_KEYS.INFINITEPAY, JSON.stringify(config));
    // Salva também na chave legada para sincronização
    localStorage.setItem(STORAGE_KEYS.INTER, JSON.stringify(config));
  },

  getInter: (): ConfiguracaoInfinitePay => {
    return StorageService.getInfinitePay();
  },

  saveInter: (config: ConfiguracaoInfinitePay): void => {
    StorageService.saveInfinitePay(config);
  },

  getProcedimentos: (): Procedimento[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROCEDIMENTOS);
      return data ? JSON.parse(data) : DEFAULT_PROCEDIMENTOS;
    } catch {
      return DEFAULT_PROCEDIMENTOS;
    }
  },

  saveProcedimentos: (list: Procedimento[]): void => {
    localStorage.setItem(STORAGE_KEYS.PROCEDIMENTOS, JSON.stringify(list));
  },

  getPacientes: (): Paciente[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PACIENTES);
      return data ? JSON.parse(data) : DEFAULT_PACIENTES;
    } catch {
      return DEFAULT_PACIENTES;
    }
  },

  savePacientes: (list: Paciente[]): void => {
    localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(list));
  },

  getEvolucoes: (): EvolucaoClinica[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVOLUCOES);
      return data ? JSON.parse(data) : DEFAULT_EVOLUCOES;
    } catch {
      return DEFAULT_EVOLUCOES;
    }
  },

  saveEvolucoes: (list: EvolucaoClinica[]): void => {
    localStorage.setItem(STORAGE_KEYS.EVOLUCOES, JSON.stringify(list));
  },

  getAgendamentos: (): Agendamento[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AGENDAMENTOS);
      return data ? JSON.parse(data) : DEFAULT_AGENDAMENTOS;
    } catch {
      return DEFAULT_AGENDAMENTOS;
    }
  },

  saveAgendamentos: (list: Agendamento[]): void => {
    localStorage.setItem(STORAGE_KEYS.AGENDAMENTOS, JSON.stringify(list));
  },

  getFinanceiro: (): TransacaoFinanceira[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINANCEIRO);
      return data ? JSON.parse(data) : DEFAULT_FINANCEIRO;
    } catch {
      return DEFAULT_FINANCEIRO;
    }
  },

  saveFinanceiro: (list: TransacaoFinanceira[]): void => {
    localStorage.setItem(STORAGE_KEYS.FINANCEIRO, JSON.stringify(list));
  },

  getPacotes: (): PacoteSessoes[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PACOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePacotes: (list: PacoteSessoes[]): void => {
    localStorage.setItem(STORAGE_KEYS.PACOTES, JSON.stringify(list));
  },
};
