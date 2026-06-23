/** Fuso usado nos jogos e na interface do bolão (horário de Brasília). */
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Chave de calendário YYYY-MM-DD no fuso informado (padrão: Brasília).
 */
export function getCalendarDayKey(date = new Date(), timeZone = BRAZIL_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

/**
 * Dia do calendário de um jogo a partir do ISO com offset (ex.: 2026-06-22T22:00:00-03:00).
 */
export function getMatchDayKey(matchDate) {
  return matchDate.slice(0, 10)
}
