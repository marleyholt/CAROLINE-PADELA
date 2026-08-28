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
