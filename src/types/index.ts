export type ProcedimentoCategoria = 'massoterapia' | 'fisioterapia' | 'estetica' | 'terapia_manual';

export interface Procedimento {
  id: string;
  nome: string;
  categoria: ProcedimentoCategoria;
  tipo?: 'avulso' | 'pacote'; // Define se é sessão avulsa ou pacote
  quantidadeSessoes?: number; // Qtd de sessões caso seja pacote (ex: 8)
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
  // InfinitePay Checkout & Redirect info
  checkoutUrl?: string;
  slugPagamento?: string;
  transactionNsu?: string;
  receiptUrl?: string;
  captureMethod?: string;
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
  
  // Detalhes Clínicos & Antropometria da Sessão (Acompanhamento de Drenagem / Perda de Líquidos)
  pesoKg?: string | number; // Peso inicial / registrado na sessão (ex: "65.4" ou "65.4 kg")
  pesoFinalSessaoKg?: string | number; // Peso pós-sessão/drenagem (ex: "64.9 kg") - Opcional
  circunferenciaCm?: string; // Medidas de circunferência (ex: "Abdômen: 78cm, Coxa: 54cm") - Opcional

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
  peso?: string; // Massa corporal (ex: "68 kg" ou "68") - Opcional
  altura?: string; // Altura (ex: "1.72 m" ou "172 cm") - Opcional
  idade?: string | number; // Idade (ex: "34" ou 34) - Opcional
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

export interface ExcecaoDataDisponibilidade {
  id: string;
  data: string; // YYYY-MM-DD (ex: "2026-08-18")
  tipo: 'fechado' | 'personalizado'; // 'fechado' = data bloqueada/fechada; 'personalizado' = horários específicos nesta data (ex: apenas à tarde)
  horarios?: string[]; // Horários específicos para esta data (ex: ['13:30', '14:45', '16:00', '17:15'])
  motivo?: string; // Motivo opcional (ex: "Manhã fechada - Atendimento apenas à tarde", "Folga", "Curso")
}

export interface ConfiguracaoClinica {
  nomeClinica: string;
  nomeTerapeuta: string;
  registroProfissional: string; // Ex: CRT 48920 / CREFITO-3 / ABRATH
  especialidade: string; // Massoterapia Clínica & Terapias Manuais
  whatsapp: string;
  email: string;
  telefone: string;
  instagram: string;
  endereco: string;
  cidadeUf: string;
  cnpjCpf: string;
  logoUrl: string;
  assinaturaUrl?: string; // Imagem da assinatura para o rodapé do PDF
  assinaturaBgColor?: string; // Cor de fundo extraída/definida para o rodapé do PDF (Ex: #EDF1EB)
  textoMarcaDagua: string;
  mensagemWhatsappPadrao: string;
  // Disponibilidade e Grade de Atendimento do Terapeuta
  diasSemanaDisponiveis?: number[]; // [0, 1, 2, 3, 4, 5, 6] onde 0=Dom, 1=Seg, ..., 6=Sáb
  horariosDisponiveis?: string[]; // Ex: ['08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45']
  intervaloMinutos?: number; // Ex: 75 minutos por atendimento
  excecoesDias?: ExcecaoDataDisponibilidade[]; // Configuração específica para datas selecionadas (bloqueio total ou horário diferenciado por dia)
}

export interface ConfiguracaoInfinitePay {
  chavePix: string;
  tipoChavePix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  nomeTitular: string;
  cidadeTitular: string;
  infiniteTag: string; // Ex: carolpadela ou $carolpadela
  linkPagamento: string; // Link direto de cobrança
  webhookUrl?: string; // URL do webhook no servidor Laravel (ex: https://meuservidor.com.br/api/infinitepay/webhook)
  redirectUrl?: string; // URL de retorno após pagamento
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

