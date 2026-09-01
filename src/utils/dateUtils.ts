import { ConfiguracaoClinica } from '../types';

/**
 * Date formatting utilities immune to UTC timezone offset bugs
 */
export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return '-';
  const clean = dataStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
}

export function formatarDataHoraBR(dataStr?: string, horaStr?: string): string {
  const dt = formatarDataBR(dataStr);
  return horaStr ? `${dt} às ${horaStr}h` : dt;
}

export function getHojeISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DisponibilidadeDataResult {
  disponivel: boolean;
  horarios: string[];
  isExcecao: boolean;
  tipoExcecao?: 'fechado' | 'personalizado';
  motivoExcecao?: string;
  avisoDisponibilidade?: string;
}

/**
 * Retorna se o dia tem disponibilidade e quais os horários possíveis,
 * respeitando exceções/datas específicas ou a grade padrão da semana de trabalho.
 */
export function getDisponibilidadeParaData(
  dataStr: string,
  configClinica: ConfiguracaoClinica
): DisponibilidadeDataResult {
  if (!dataStr) {
    return {
      disponivel: false,
      horarios: [],
      isExcecao: false,
    };
  }

  // 1. Verifica se existe uma Exceção / Configuração Específica para esta data
  const excecoes = configClinica.excecoesDias || [];
  const excecao = excecoes.find((e) => e.data === dataStr);

  if (excecao) {
    if (excecao.tipo === 'fechado') {
      return {
        disponivel: false,
        horarios: [],
        isExcecao: true,
        tipoExcecao: 'fechado',
        motivoExcecao: excecao.motivo || 'Agenda fechada / bloqueada nesta data.',
        avisoDisponibilidade: excecao.motivo ? `Data com atendimento fechado: ${excecao.motivo}` : 'Agenda fechada nesta data.',
      };
    } else {
      // Horários específicos configurados para esta data (ex: apenas à tarde)
      const hrs = excecao.horarios || [];
      return {
        disponivel: hrs.length > 0,
        horarios: hrs,
        isExcecao: true,
        tipoExcecao: 'personalizado',
        motivoExcecao: excecao.motivo || 'Horários específicos para esta data.',
        avisoDisponibilidade: excecao.motivo ? `Horários especiais: ${excecao.motivo}` : 'Horários personalizados para esta data.',
      };
    }
  }

  // 2. Sem exceção cadastrada: aplica a Semana Padrão de Trabalho
  const clean = dataStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [ano, mes, dia] = parts.map(Number);
    // Cria data segura em UTC local
    const dt = new Date(ano, mes - 1, dia);
    const diaSemana = dt.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
    const diasAtivos = configClinica.diasSemanaDisponiveis || [1, 2, 3, 4, 5, 6];

    if (!diasAtivos.includes(diaSemana)) {
      const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return {
        disponivel: false,
        horarios: [],
        isExcecao: false,
        avisoDisponibilidade: `A terapeuta não possui atendimento às ${nomesDias[diaSemana]}s na semana padrão.`,
      };
    }
  }

  const horariosPadrao =
    configClinica.horariosDisponiveis && configClinica.horariosDisponiveis.length > 0
      ? configClinica.horariosDisponiveis
      : ['08:30', '09:45', '11:00', '13:30', '14:45', '16:00', '17:15', '18:30'];

  return {
    disponivel: true,
    horarios: horariosPadrao,
    isExcecao: false,
  };
}

