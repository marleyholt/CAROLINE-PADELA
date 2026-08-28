import { Agendamento, ConfiguracaoClinica } from '../types';
import { formatarDataBR } from '../utils/dateUtils';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Converte data (YYYY-MM-DD) e horário (HH:mm) para strings ISO no fuso horário do Brasil (-03:00)
 */
function calcularInicioEFimISO(data: string, horario: string, duracaoMinutos: number) {
  const [hora, min] = (horario || '14:00').split(':').map(Number);
  const startDateTime = `${data}T${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}:00-03:00`;

  // Calcular término
  const totalMinutos = hora * 60 + min + (duracaoMinutos || 60);
  const fimHora = Math.floor(totalMinutos / 60) % 24;
  const fimMin = totalMinutos % 60;
  const endDateTime = `${data}T${String(fimHora).padStart(2, '0')}:${String(fimMin).padStart(2, '0')}:00-03:00`;

  return { startDateTime, endDateTime };
}

/**
 * Retorna o título e descrição formatados para a Google Agenda com sinalização de cobrança
 */
function gerarDadosEvento(ag: Agendamento, clinica: ConfiguracaoClinica) {
  let statusTexto = '🔴 A PAGAR';
  if (ag.statusPagamento === 'pago_integral' || ag.status === 'concluido') {
    statusTexto = '🟢 PAGO INTEGRAL';
  } else if (ag.statusPagamento === 'pago_sinal' || ag.status === 'sinal_pago') {
    statusTexto = '🟡 SINAL 50% PAGO';
  }

  const summary = `🌿 [${statusTexto}] ${ag.procedimentoNome} - ${ag.pacienteNome}`;

  const dataFormatada = formatarDataBR(ag.data);
  const description = `💆 CONSULTÓRIO DE MASSOTERAPIA & TERAPIAS MANUAIS
${clinica.nomeClinica || 'Espaço de Atendimento'}
Responsável: ${clinica.nomeTerapeuta || 'Terapeuta'} (${clinica.registroProfissional || ''})

📋 DADOS DO AGENDAMENTO:
• Paciente: ${ag.pacienteNome}
• WhatsApp: ${ag.pacienteWhatsapp}
• Procedimento: ${ag.procedimentoNome} (${ag.duracaoMinutos} min)
• Data: ${dataFormatada} às ${ag.horario}h

💰 CONTROLE DE COBRANÇA NA HORA:
• Status Financeiro: ${statusTexto}
• Valor Total: R$ ${ag.valorTotal.toFixed(2)}
• Sinal (50%): R$ ${ag.valorSinal.toFixed(2)} (${ag.statusPagamento === 'pago_sinal' || ag.statusPagamento === 'pago_integral' ? 'RECEBIDO VIA PIX/INTER' : 'PENDENTE DE RECEBIMENTO'})
• Restante a Cobrar na Sessão: R$ ${ag.statusPagamento === 'pago_integral' ? '0,00 (QUITADO)' : `${ag.valorRestante.toFixed(2)} (A RECEBER)`}

📍 LOCAL:
${clinica.endereco || 'Endereço do consultório'} - ${clinica.cidadeUf || ''}

📝 OBSERVAÇÕES:
${ag.observacoes || 'Agendamento sincronizado automaticamente pelo sistema da clínica.'}
`;

  return { summary, description };
}

/**
 * Cria um evento bloqueador na Google Agenda do usuário e retorna o eventId
 */
export async function criarEventoGoogleCalendar(
  ag: Agendamento,
  clinica: ConfiguracaoClinica,
  accessToken: string
): Promise<string | null> {
  if (!accessToken) return null;

  try {
    const { startDateTime, endDateTime } = calcularInicioEFimISO(ag.data, ag.horario, ag.duracaoMinutos);
    const { summary, description } = gerarDadosEvento(ag, clinica);

    const eventPayload = {
      summary,
      description,
      location: `${clinica.endereco || ''} - ${clinica.cidadeUf || ''}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      // 'opaque' bloqueia o horário na agenda (fica marcado como ocupado para travar o horário)
      transparency: 'opaque',
      status: 'confirmed',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 120 },
        ],
      },
    };

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro na resposta do Google Calendar:', response.status, errText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id || null;
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err);
    return null;
  }
}

/**
 * Atualiza um evento existente na Google Agenda (ex: mudança de status de pagamento)
 */
export async function atualizarEventoGoogleCalendar(
  ag: Agendamento,
  clinica: ConfiguracaoClinica,
  accessToken: string
): Promise<boolean> {
  if (!accessToken || !ag.googleEventId) return false;

  try {
    const { startDateTime, endDateTime } = calcularInicioEFimISO(ag.data, ag.horario, ag.duracaoMinutos);
    const { summary, description } = gerarDadosEvento(ag, clinica);

    const eventPayload = {
      summary,
      description,
      location: `${clinica.endereco || ''} - ${clinica.cidadeUf || ''}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      transparency: 'opaque',
      status: ag.status === 'cancelado' ? 'cancelled' : 'confirmed',
    };

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${ag.googleEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    return response.ok;
  } catch (err) {
    console.warn('Falha na atualização do Google Calendar:', err);
    return false;
  }
}

/**
 * Exclui evento da Google Agenda
 */
export async function excluirEventoGoogleCalendar(
  eventId: string,
  accessToken: string
): Promise<boolean> {
  if (!accessToken || !eventId) return false;

  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok || response.status === 404;
  } catch (err) {
    console.warn('Erro ao excluir evento Google Agenda:', err);
    return false;
  }
}

/**
 * Sincroniza em massa todos os agendamentos na Google Agenda
 */
export async function sincronizarAgendamentosEmMassa(
  agendamentos: Agendamento[],
  clinica: ConfiguracaoClinica,
  accessToken: string
): Promise<{ agendamentoId: string; eventId?: string }[]> {
  const results: { agendamentoId: string; eventId?: string }[] = [];

  for (const ag of agendamentos) {
    if (ag.status === 'cancelado') continue;

    if (ag.googleEventId) {
      await atualizarEventoGoogleCalendar(ag, clinica, accessToken);
      results.push({ agendamentoId: ag.id, eventId: ag.googleEventId });
    } else {
      const eventId = await criarEventoGoogleCalendar(ag, clinica, accessToken);
      if (eventId) {
        results.push({ agendamentoId: ag.id, eventId });
      }
    }
  }

  return results;
}

/**
 * Consulta horários bloqueados/ocupados na Google Agenda para um dia específico
 */
export async function buscarHorariosOcupadosGoogleCalendar(
  data: string, // YYYY-MM-DD
  accessToken: string
): Promise<{ start: string; end: string; summary: string }[]> {
  if (!accessToken || !data) return [];

  try {
    const timeMin = `${data}T00:00:00-03:00`;
    const timeMax = `${data}T23:59:59-03:00`;

    const url = `${CALENDAR_API_BASE}/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return [];

    const dataJson = await response.json();
    const items = dataJson.items || [];

    return items
      .filter((item: any) => item.status !== 'cancelled')
      .map((item: any) => ({
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        summary: item.summary || 'Ocupado na Agenda',
      }));
  } catch (e) {
    console.warn('Erro ao buscar eventos do Google Calendar:', e);
    return [];
  }
}
