/**
 * matches.js — Lista completa de jogos da Copa do Mundo FIFA 2026
 * Horários em BRT (Brasília, UTC-3)
 * Fonte: FIFA.com + comites-sede oficiais (verificado em 26/05/2026)
 *
 * Fases:
 *   "group"    — Fase de Grupos (multiplicador 1x)
 *   "r32"      — Rodada de 32 (multiplicador 1.5x)
 *   "r16"      — Oitavas de Final (multiplicador 2x)
 *   "qf"       — Quartas de Final (multiplicador 3x)
 *   "sf"       — Semifinal (multiplicador 4x)
 *   "third"    — Disputa pelo 3º Lugar (multiplicador 4x)
 *   "final"    — Final (multiplicador 5x)
 */

export const PHASE_CONFIG = {
  group: { label: 'Fase de Grupos',        multiplier: 1.0, order: 1 },
  r32:   { label: 'Rodada de 32',          multiplier: 1.5, order: 2 },
  r16:   { label: 'Oitavas de Final',      multiplier: 2.0, order: 3 },
  qf:    { label: 'Quartas de Final',      multiplier: 3.0, order: 4 },
  sf:    { label: 'Semifinal',             multiplier: 4.0, order: 5 },
  third: { label: 'Disputa pelo 3º Lugar', multiplier: 4.0, order: 6 },
  final: { label: 'Final',                 multiplier: 5.0, order: 7 },
}

// dateTime está em ISO 8601 no fuso America/Sao_Paulo (BRT = UTC-3)
// deadline do palpite = dateTime - 10 minutos
export const MATCHES = [
  // ─── FASE DE GRUPOS — 1ª RODADA ───────────────────────────────────────────
  { id: 'G01', phase: 'group', group: 'A', date: '2026-06-11T16:00:00-03:00', home: 'México',          away: 'África do Sul',  venue: 'Cidade do México' },
  { id: 'G02', phase: 'group', group: 'A', date: '2026-06-11T23:00:00-03:00', home: 'Coreia do Sul',   away: 'República Tcheca', venue: 'Guadalajara' },
  { id: 'G03', phase: 'group', group: 'B', date: '2026-06-12T16:00:00-03:00', home: 'Canadá',          away: 'Bósnia-Herzegovina', venue: 'Toronto' },
  { id: 'G04', phase: 'group', group: 'D', date: '2026-06-12T22:00:00-03:00', home: 'Estados Unidos',  away: 'Paraguai',       venue: 'Los Angeles' },
  { id: 'G05', phase: 'group', group: 'D', date: '2026-06-14T01:00:00-03:00', home: 'Austrália',       away: 'Turquia',        venue: 'Vancouver' },
  { id: 'G06', phase: 'group', group: 'B', date: '2026-06-13T16:00:00-03:00', home: 'Catar',           away: 'Suíça',          venue: 'San Francisco' },
  { id: 'G07', phase: 'group', group: 'C', date: '2026-06-13T19:00:00-03:00', home: 'Brasil',          away: 'Marrocos',       venue: 'Nova York/NJ' },
  { id: 'G08', phase: 'group', group: 'C', date: '2026-06-13T22:00:00-03:00', home: 'Haiti',           away: 'Escócia',        venue: 'Boston' },
  { id: 'G09', phase: 'group', group: 'E', date: '2026-06-14T14:00:00-03:00', home: 'Alemanha',        away: 'Curaçao',        venue: 'Houston' },
  { id: 'G10', phase: 'group', group: 'F', date: '2026-06-14T17:00:00-03:00', home: 'Países Baixos',   away: 'Japão',          venue: 'Dallas' },
  { id: 'G11', phase: 'group', group: 'E', date: '2026-06-14T20:00:00-03:00', home: 'Costa do Marfim', away: 'Equador',        venue: 'Philadelphia' },
  { id: 'G12', phase: 'group', group: 'F', date: '2026-06-14T23:00:00-03:00', home: 'Suécia',          away: 'Tunísia',        venue: 'Monterrey' },
  { id: 'G13', phase: 'group', group: 'H', date: '2026-06-15T13:00:00-03:00', home: 'Espanha',         away: 'Cabo Verde',     venue: 'Atlanta' },
  { id: 'G14', phase: 'group', group: 'G', date: '2026-06-15T16:00:00-03:00', home: 'Bélgica',         away: 'Egito',          venue: 'Seattle' },
  { id: 'G15', phase: 'group', group: 'H', date: '2026-06-15T19:00:00-03:00', home: 'Arábia Saudita',  away: 'Uruguai',        venue: 'Miami' },
  { id: 'G16', phase: 'group', group: 'G', date: '2026-06-15T22:00:00-03:00', home: 'Irã',             away: 'Nova Zelândia',  venue: 'Los Angeles' },
  { id: 'G17', phase: 'group', group: 'J', date: '2026-06-17T01:00:00-03:00', home: 'Áustria',         away: 'Jordânia',       venue: 'San Francisco' },
  { id: 'G18', phase: 'group', group: 'I', date: '2026-06-16T16:00:00-03:00', home: 'França',          away: 'Senegal',        venue: 'Nova York/NJ' },
  { id: 'G19', phase: 'group', group: 'I', date: '2026-06-16T19:00:00-03:00', home: 'Iraque',          away: 'Noruega',        venue: 'Boston' },
  { id: 'G20', phase: 'group', group: 'J', date: '2026-06-16T22:00:00-03:00', home: 'Argentina',       away: 'Argélia',        venue: 'Kansas City' },
  { id: 'G21', phase: 'group', group: 'K', date: '2026-06-17T14:00:00-03:00', home: 'Portugal',        away: 'Congo (RD)',     venue: 'Houston' },
  { id: 'G22', phase: 'group', group: 'L', date: '2026-06-17T17:00:00-03:00', home: 'Inglaterra',      away: 'Croácia',        venue: 'Dallas' },
  { id: 'G23', phase: 'group', group: 'L', date: '2026-06-17T20:00:00-03:00', home: 'Gana',            away: 'Panamá',         venue: 'Toronto' },
  { id: 'G24', phase: 'group', group: 'K', date: '2026-06-17T23:00:00-03:00', home: 'Uzbequistão',     away: 'Colômbia',       venue: 'Cidade do México' },

  // ─── FASE DE GRUPOS — 2ª RODADA ───────────────────────────────────────────
  { id: 'G25', phase: 'group', group: 'A', date: '2026-06-18T13:00:00-03:00', home: 'República Tcheca', away: 'África do Sul',  venue: 'Atlanta' },
  { id: 'G26', phase: 'group', group: 'B', date: '2026-06-18T16:00:00-03:00', home: 'Suíça',            away: 'Bósnia-Herzegovina', venue: 'Los Angeles' },
  { id: 'G27', phase: 'group', group: 'B', date: '2026-06-18T19:00:00-03:00', home: 'Canadá',           away: 'Catar',          venue: 'Vancouver' },
  { id: 'G28', phase: 'group', group: 'A', date: '2026-06-18T22:00:00-03:00', home: 'México',           away: 'Coreia do Sul',  venue: 'Guadalajara' },
  { id: 'G29', phase: 'group', group: 'D', date: '2026-06-20T01:00:00-03:00', home: 'Turquia',          away: 'Paraguai',       venue: 'San Francisco' },
  { id: 'G30', phase: 'group', group: 'D', date: '2026-06-19T16:00:00-03:00', home: 'Estados Unidos',   away: 'Austrália',      venue: 'Seattle' },
  { id: 'G31', phase: 'group', group: 'C', date: '2026-06-19T19:00:00-03:00', home: 'Escócia',          away: 'Marrocos',       venue: 'Boston' },
  { id: 'G32', phase: 'group', group: 'C', date: '2026-06-19T21:30:00-03:00', home: 'Brasil',           away: 'Haiti',          venue: 'Philadelphia' },
  { id: 'G33', phase: 'group', group: 'F', date: '2026-06-21T01:00:00-03:00', home: 'Tunísia',          away: 'Japão',          venue: 'Monterrey' },
  { id: 'G34', phase: 'group', group: 'F', date: '2026-06-20T14:00:00-03:00', home: 'Países Baixos',    away: 'Suécia',         venue: 'Houston' },
  { id: 'G35', phase: 'group', group: 'E', date: '2026-06-20T17:00:00-03:00', home: 'Alemanha',         away: 'Costa do Marfim', venue: 'Toronto' },
  { id: 'G36', phase: 'group', group: 'E', date: '2026-06-20T21:00:00-03:00', home: 'Equador',          away: 'Curaçao',        venue: 'Kansas City' },
  { id: 'G37', phase: 'group', group: 'H', date: '2026-06-21T13:00:00-03:00', home: 'Espanha',          away: 'Arábia Saudita', venue: 'Atlanta' },
  { id: 'G38', phase: 'group', group: 'G', date: '2026-06-21T16:00:00-03:00', home: 'Bélgica',          away: 'Irã',            venue: 'Los Angeles' },
  { id: 'G39', phase: 'group', group: 'H', date: '2026-06-21T19:00:00-03:00', home: 'Uruguai',          away: 'Cabo Verde',     venue: 'Miami' },
  { id: 'G40', phase: 'group', group: 'G', date: '2026-06-21T22:00:00-03:00', home: 'Nova Zelândia',    away: 'Egito',          venue: 'Vancouver' },
  { id: 'G41', phase: 'group', group: 'J', date: '2026-06-23T00:00:00-03:00', home: 'Jordânia',         away: 'Argélia',        venue: 'San Francisco' },
  { id: 'G42', phase: 'group', group: 'J', date: '2026-06-22T14:00:00-03:00', home: 'Argentina',        away: 'Áustria',        venue: 'Dallas' },
  { id: 'G43', phase: 'group', group: 'I', date: '2026-06-22T18:00:00-03:00', home: 'França',           away: 'Iraque',         venue: 'Philadelphia' },
  { id: 'G44', phase: 'group', group: 'I', date: '2026-06-22T21:00:00-03:00', home: 'Noruega',          away: 'Senegal',        venue: 'Nova York/NJ' },
  { id: 'G45', phase: 'group', group: 'K', date: '2026-06-23T14:00:00-03:00', home: 'Portugal',         away: 'Uzbequistão',    venue: 'Houston' },
  { id: 'G46', phase: 'group', group: 'L', date: '2026-06-23T17:00:00-03:00', home: 'Inglaterra',       away: 'Gana',           venue: 'Boston' },
  { id: 'G47', phase: 'group', group: 'L', date: '2026-06-23T20:00:00-03:00', home: 'Panamá',           away: 'Croácia',        venue: 'Toronto' },
  { id: 'G48', phase: 'group', group: 'K', date: '2026-06-23T23:00:00-03:00', home: 'Colômbia',         away: 'Congo (RD)',     venue: 'Guadalajara' },

  // ─── FASE DE GRUPOS — 3ª RODADA ───────────────────────────────────────────
  { id: 'G49', phase: 'group', group: 'B', date: '2026-06-24T16:00:00-03:00', home: 'Suíça',            away: 'Canadá',         venue: 'Vancouver' },
  { id: 'G50', phase: 'group', group: 'B', date: '2026-06-24T16:00:00-03:00', home: 'Bósnia-Herzegovina', away: 'Catar',        venue: 'Seattle' },
  { id: 'G51', phase: 'group', group: 'C', date: '2026-06-24T19:00:00-03:00', home: 'Escócia',          away: 'Brasil',         venue: 'Miami' },
  { id: 'G52', phase: 'group', group: 'C', date: '2026-06-24T19:00:00-03:00', home: 'Marrocos',         away: 'Haiti',          venue: 'Atlanta' },
  { id: 'G53', phase: 'group', group: 'A', date: '2026-06-24T22:00:00-03:00', home: 'República Tcheca', away: 'México',         venue: 'Cidade do México' },
  { id: 'G54', phase: 'group', group: 'A', date: '2026-06-24T22:00:00-03:00', home: 'África do Sul',    away: 'Coreia do Sul',  venue: 'Monterrey' },
  { id: 'G55', phase: 'group', group: 'E', date: '2026-06-25T17:00:00-03:00', home: 'Curaçao',          away: 'Costa do Marfim', venue: 'Philadelphia' },
  { id: 'G56', phase: 'group', group: 'E', date: '2026-06-25T17:00:00-03:00', home: 'Equador',          away: 'Alemanha',       venue: 'Nova York/NJ' },
  { id: 'G57', phase: 'group', group: 'F', date: '2026-06-25T20:00:00-03:00', home: 'Japão',            away: 'Suécia',         venue: 'Dallas' },
  { id: 'G58', phase: 'group', group: 'F', date: '2026-06-25T20:00:00-03:00', home: 'Tunísia',          away: 'Países Baixos',  venue: 'Kansas City' },
  { id: 'G59', phase: 'group', group: 'D', date: '2026-06-25T23:00:00-03:00', home: 'Turquia',          away: 'Estados Unidos', venue: 'Los Angeles' },
  { id: 'G60', phase: 'group', group: 'D', date: '2026-06-25T23:00:00-03:00', home: 'Paraguai',         away: 'Austrália',      venue: 'San Francisco' },
  { id: 'G61', phase: 'group', group: 'I', date: '2026-06-26T16:00:00-03:00', home: 'Noruega',          away: 'França',         venue: 'Boston' },
  { id: 'G62', phase: 'group', group: 'I', date: '2026-06-26T16:00:00-03:00', home: 'Senegal',          away: 'Iraque',         venue: 'Toronto' },
  { id: 'G63', phase: 'group', group: 'H', date: '2026-06-26T21:00:00-03:00', home: 'Cabo Verde',       away: 'Arábia Saudita', venue: 'Houston' },
  { id: 'G64', phase: 'group', group: 'H', date: '2026-06-26T21:00:00-03:00', home: 'Uruguai',          away: 'Espanha',        venue: 'Guadalajara' },
  { id: 'G65', phase: 'group', group: 'G', date: '2026-06-27T00:00:00-03:00', home: 'Egito',            away: 'Irã',            venue: 'Seattle' },
  { id: 'G66', phase: 'group', group: 'G', date: '2026-06-27T00:00:00-03:00', home: 'Nova Zelândia',    away: 'Bélgica',        venue: 'Vancouver' },
  { id: 'G67', phase: 'group', group: 'L', date: '2026-06-27T18:00:00-03:00', home: 'Panamá',           away: 'Inglaterra',     venue: 'Nova York/NJ' },
  { id: 'G68', phase: 'group', group: 'L', date: '2026-06-27T18:00:00-03:00', home: 'Croácia',          away: 'Gana',           venue: 'Philadelphia' },
  { id: 'G69', phase: 'group', group: 'K', date: '2026-06-27T20:30:00-03:00', home: 'Colômbia',         away: 'Portugal',       venue: 'Miami' },
  { id: 'G70', phase: 'group', group: 'K', date: '2026-06-27T20:30:00-03:00', home: 'Congo (RD)',       away: 'Uzbequistão',    venue: 'Atlanta' },
  { id: 'G71', phase: 'group', group: 'J', date: '2026-06-27T23:00:00-03:00', home: 'Argélia',          away: 'Áustria',        venue: 'Kansas City' },
  { id: 'G72', phase: 'group', group: 'J', date: '2026-06-27T23:00:00-03:00', home: 'Jordânia',         away: 'Argentina',      venue: 'Dallas' },

  // ─── RODADA DE 32 (mata-mata) ─────────────────────────────────────────────
  { id: 'R01', phase: 'r32',   group: null, date: '2026-06-28T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Los Angeles' },
  { id: 'R02', phase: 'r32',   group: null, date: '2026-06-29T14:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Houston' },
  { id: 'R03', phase: 'r32',   group: null, date: '2026-06-29T17:30:00-03:00', home: 'A definir', away: 'A definir', venue: 'Boston' },
  { id: 'R04', phase: 'r32',   group: null, date: '2026-06-29T22:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Monterrey' },
  { id: 'R05', phase: 'r32',   group: null, date: '2026-06-30T14:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Dallas' },
  { id: 'R06', phase: 'r32',   group: null, date: '2026-06-30T18:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Nova York/NJ' },
  { id: 'R07', phase: 'r32',   group: null, date: '2026-06-30T22:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Cidade do México' },
  { id: 'R08', phase: 'r32',   group: null, date: '2026-07-01T13:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Atlanta' },
  { id: 'R09', phase: 'r32',   group: null, date: '2026-07-01T17:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Seattle' },
  { id: 'R10', phase: 'r32',   group: null, date: '2026-07-01T21:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'San Francisco' },
  { id: 'R11', phase: 'r32',   group: null, date: '2026-07-03T00:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Vancouver' },
  { id: 'R12', phase: 'r32',   group: null, date: '2026-07-02T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Los Angeles' },
  { id: 'R13', phase: 'r32',   group: null, date: '2026-07-02T20:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Toronto' },
  { id: 'R14', phase: 'r32',   group: null, date: '2026-07-03T15:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Dallas' },
  { id: 'R15', phase: 'r32',   group: null, date: '2026-07-03T19:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Miami' },
  { id: 'R16', phase: 'r32',   group: null, date: '2026-07-03T22:30:00-03:00', home: 'A definir', away: 'A definir', venue: 'Kansas City' },

  // ─── OITAVAS DE FINAL ─────────────────────────────────────────────────────
  { id: 'O01', phase: 'r16',   group: null, date: '2026-07-04T14:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Houston' },
  { id: 'O02', phase: 'r16',   group: null, date: '2026-07-04T18:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Philadelphia' },
  { id: 'O03', phase: 'r16',   group: null, date: '2026-07-05T17:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Nova York/NJ' },
  { id: 'O04', phase: 'r16',   group: null, date: '2026-07-05T21:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Cidade do México' },
  { id: 'O05', phase: 'r16',   group: null, date: '2026-07-06T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Dallas' },
  { id: 'O06', phase: 'r16',   group: null, date: '2026-07-06T21:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Seattle' },
  { id: 'O07', phase: 'r16',   group: null, date: '2026-07-07T13:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Atlanta' },
  { id: 'O08', phase: 'r16',   group: null, date: '2026-07-07T17:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Vancouver' },

  // ─── QUARTAS DE FINAL ─────────────────────────────────────────────────────
  { id: 'Q01', phase: 'qf',    group: null, date: '2026-07-09T17:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Boston' },
  { id: 'Q02', phase: 'qf',    group: null, date: '2026-07-10T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Los Angeles' },
  { id: 'Q03', phase: 'qf',    group: null, date: '2026-07-11T18:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Miami' },
  { id: 'Q04', phase: 'qf',    group: null, date: '2026-07-11T22:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Kansas City' },

  // ─── SEMIFINAIS ───────────────────────────────────────────────────────────
  { id: 'S01', phase: 'sf',    group: null, date: '2026-07-14T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Dallas' },
  { id: 'S02', phase: 'sf',    group: null, date: '2026-07-15T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Atlanta' },

  // ─── DISPUTA PELO 3º LUGAR ────────────────────────────────────────────────
  { id: 'T01', phase: 'third', group: null, date: '2026-07-18T18:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Miami' },

  // ─── FINAL ────────────────────────────────────────────────────────────────
  { id: 'F01', phase: 'final', group: null, date: '2026-07-19T16:00:00-03:00', home: 'A definir', away: 'A definir', venue: 'Nova York/NJ — MetLife Stadium' },
]

export function applyMatchSchedule(baseMatches, matchSchedule = {}) {
  return baseMatches.map(match => {
    const scheduled = matchSchedule?.[match.id]
    if (!scheduled?.date || Number.isNaN(new Date(scheduled.date).getTime())) return match

    return {
      ...match,
      date: scheduled.date,
    }
  })
}

/**
 * Retorna o deadline de palpite: 10 minutos antes do início da partida
 */
export function getBetDeadline(matchDate) {
  const d = new Date(matchDate)
  d.setMinutes(d.getMinutes() - 10)
  return d
}

/**
 * Verifica se o palpite ainda está dentro do prazo
 */
export function isBettingOpen(matchDate) {
  return new Date() < getBetDeadline(matchDate)
}
