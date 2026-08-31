export type ProcedimentoCategoria = 'massoterapia' | 'fisioterapia' | 'estetica' | 'terapia_manual';

export interface Procedimento {
  id: string;
  nome: string;
  categoria: ProcedimentoCategoria;
  duracaoMinutos: number;
  precoTotal: number;
  sinalPercentual: number; // default 50%
  valorSinal: number;
  descricao: string;
  corTag: string;
  ativo: boolean;
}

export type StatusAgendamento = 
  | 'aguardando_sinal'
  | 'sinal_pago'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado';

export type StatusPagamento = 'a_pagar' | 'pago_sinal' | 'pago_integral';

export type MetodoPagamentoSinal = 'pix_infinitepay' | 'pix_inter' | 'cartao_credito' | 'dinheiro_presencial';

export interface Agendamento {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteWhatsapp: string;
  pacienteEmail?: string;
  procedimentoId: string;
  procedimentoNome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  duracaoMinutos: number;
  valorTotal: number;
  valorSinal: number; // 50%
  valorRestante: number; // 50%
  status: StatusAgendamento;
  statusPagamento: StatusPagamento;
  metodoSinal?: MetodoPagamentoSinal;
  pixCopiaECola?: string;
  pixTxId?: string;
  sinalPagoEm?: string;
  restantePagoEm?: string;
  googleEventId?: string;
  googleCalendarSynced?: boolean;
  observacoes?: string;
  criadoEm: string;
}

export interface RegiaoDor {
  regiao: string;
  intensidade: number; // 0 to 10
  tipo: 'tensao' | 'dor_aguda' | 'dor_cronica' | 'edema' | 'ponto_gatilho';
}

export interface EvolucaoClinica {
  id: string;
  pacienteId: string;
  agendamentoId?: string;
  dataSessao: string; // YYYY-MM-DD
  horario?: string; // HH:mm
  procedimentoRealizado: string;
  terapeutaResponsavel: string;
  
  // Status da sessão / relatório clínico
  statusRelatorio?: 'pendente' | 'concluido'; // 'pendente' = agendada que ainda vai acontecer / aguarda relatório; 'concluido' = relatório preenchido e finalizado
  
  // Escala Visual Analógica de Dor (0-10)
  evaInicial: number;
  evaFinal: number;
  
  // Regiões trabalhadas
  regioesTrabalhadas: string[];
  
  // Detalhes Clínicos
  queixaPrincipal: string;
  manobrasAplicadas: string; // Ex: Fricção profunda, trigger points, drenagem linfática manual Vodder
  reacaoTecidual: string; // Ex: Hiperemia transitória moderada, relaxamento miofascial expressivo
  orientacoesCasa: string; // Ex: Crioterapia 15 min, hidratação 2.5L/dia, alongamento de trapézio
  observacoesGerais: string;
  proximaSessaoRecomendada?: string;
  
  // Detalhes Financeiros da Sessão (Opcional - não incluídos no PDF de anamnese/clínico)
  valorPago?: number;
  formaPagamento?: 'pix_infinitepay' | 'pix_inter' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'pacote' | string;
  lancarFinanceiro?: boolean;
  
  criadoEm: string;
}

export interface Paciente {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  dataNascimento: string;
  profissao: string;
  cpf?: string;
  endereco?: string;
  
  // Anamnese
  queixaInicial: string;
  historicoMedico: string; // Cirurgias, fraturas, patologias
  medicacoesUso: string;
  contraindicacoesAlergias: string;
  nivelAtividadeFisica: 'sedentario' | 'leve' | 'moderado' | 'intenso';
  
  dataCadastro: string;
  totalSessoes: number;
  ultimaSessao?: string;
}

export type TipoTransacao = 
  | 'receita_sinal' 
  | 'receita_restante' 
  | 'receita_procedimento'
  | 'receita_pacote'
  | 'receita_avulsa' 
  | 'despesa_insumos' 
  | 'despesa_fixa' 
  | 'despesa_taxas' 
  | 'despesa_marketing'
  | 'despesa_equipamentos'
  | 'despesa_outros'
  | string;

export interface ItemSessaoRealizada {
  id: string;
  data: string; // YYYY-MM-DD
  horario?: string;
  observacoes?: string;
  terapeuta?: string;
}

export interface PacoteSessoes {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteWhatsapp?: string;
  procedimentoId?: string;
  procedimentoNome: string;
  totalSessoes: number; // ex: 8
  sessoesRealizadas: number; // ex: 3
  valorTotal: number;
  valorPago: number;
  statusPagamento: 'pago_integral' | 'parcial' | 'pendente';
  status: 'ativo' | 'concluido' | 'cancelado';
  historicoRealizacoes: ItemSessaoRealizada[];
  dataContratacao: string; // YYYY-MM-DD
  observacoes?: string;
  criadoEm: string;
}

export interface TransacaoFinanceira {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: TipoTransacao;
  categoriaNome?: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  formaPagamento: 'pix_infinitepay' | 'pix_inter' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'boleto';
  agendamentoId?: string;
  pacienteId?: string;
  pacienteNome?: string;
  procedimentoId?: string;
  pacoteId?: string;
  status: 'confirmado' | 'pendente';
  comprovanteRef?: string;
  criadoEm: string;
}

export interface ConfiguracaoClinica {
  nomeClinica: string;
  nomeTerapeuta: string;
  registroProfissional: string; // Ex: CRT 48920 / CREFITO-3 / ABRATH
  especialidade: string; // Massoterapia Clínica & Terapias Manuais
  whatsapp: string;
  email: string;
  telefone: string;
  endereco: string;
  cidadeUf: string;
  cnpjCpf: string;
  logoUrl: string;
  textoMarcaDagua: string;
  mensagemWhatsappPadrao: string;
}

export interface ConfiguracaoInfinitePay {
  chavePix: string;
  tipoChavePix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  nomeTitular: string;
  cidadeTitular: string;
  infiniteTag: string; // Ex: $carolpadela ou link InfinitePay
  linkPagamento: string; // Link direto de cobrança
  apiKey: string;
  ambiente: 'producao' | 'sandbox';
  webhookAtivo: boolean;
  // Campos de compatibilidade
  clientId?: string;
  clientSecret?: string;
}

// Compatibilidade de tipo
export type ConfiguracaoInter = ConfiguracaoInfinitePay;

export interface PermissoesModulos {
  agendamentos: boolean;
  pacientes: boolean;
  financeiro: boolean;
  procedimentos: boolean;
  configuracoes: boolean;
}

export interface UsuarioTerapeuta {
  id: string;
  email: string;
  nome: string;
  fotoUrl?: string;
  role: 'master' | 'terapeuta';
  ativo: boolean;
  permissoes: PermissoesModulos;
  chaveAcessoPropria?: string;
  criadoEm: string;
  ultimoAcesso?: string;
}

export interface ConfiguracaoAcessos {
  chaveAcessoGeral: string;
  masterEmail: string;
}

