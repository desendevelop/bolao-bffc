/**
 * scoring.js — Sistema de pontuação do Bolão Copa 2026
 *
 * REGRAS BASE (fase de grupos, multiplicador 1x):
 *
 * | Situação                                                        | Pontos |
 * |----------------------------------------------------------------|--------|
 * | Errou o vencedor E o placar                                    |   0    |
 * | Acertou o vencedor, errou o placar                             |   1    |
 * | Acertou o vencedor + gols de 1 dos times (mas não o placar exato) | 2   |
 * | Acertou o vencedor + placar exato                              |   5    |
 * | Acertou empate, errou o placar                                 |   2    |
 * | Acertou empate + placar exato                                  |   5    |
 *
 * MULTIPLICADORES POR FASE:
 *   Fase de Grupos   → 1.0x
 *   Rodada de 32     → 1.5x
 *   Oitavas de Final → 2.0x
 *   Quartas de Final → 3.0x
 *   Semifinal        → 4.0x
 *   3º Lugar         → 4.0x
 *   Final            → 5.0x
 *
 * Os pontos finais preservam decimais quando o multiplicador não é inteiro
 * (ex.: 1 ponto base × 1,5 na Rodada de 32 = 1,5 pts).
 */

import { PHASE_CONFIG } from '../data/matches.js'

/**
 * Determina o vencedor a partir de um placar.
 * Retorna 'home' | 'away' | 'draw'
 */
export function getWinner(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/**
 * Calcula os pontos brutos (sem multiplicador de fase).
 *
 * @param {object} bet   - { homeGoals: number, awayGoals: number }
 * @param {object} result - { homeGoals: number, awayGoals: number }
 * @returns {number} pontos base (0, 1, 2 ou 5)
 */
export function calcBasePoints(bet, result) {
  const betWinner    = getWinner(bet.homeGoals, bet.awayGoals)
  const resultWinner = getWinner(result.homeGoals, result.awayGoals)

  const correctWinner = betWinner === resultWinner

  // Placar exato
  const exactScore =
    bet.homeGoals === result.homeGoals &&
    bet.awayGoals === result.awayGoals

  // Acertou pelo menos os gols de um dos times (mas não o placar exato)
  const oneScoreCorrect =
    !exactScore &&
    (bet.homeGoals === result.homeGoals || bet.awayGoals === result.awayGoals)

  if (betWinner === 'draw') {
    // Apostou em empate
    if (!correctWinner) return 0   // não empatou
    if (exactScore)     return 5   // empate + placar certo
    return 2                       // empate certo, placar errado
  } else {
    // Apostou em vitória de um dos times
    if (!correctWinner) return 0   // errou o vencedor
    if (exactScore)     return 5   // acertou tudo
    if (oneScoreCorrect) return 2  // acertou vencedor + gols de 1 time
    return 1                       // acertou só o vencedor
  }
}

/**
 * Normaliza pontos para evitar ruído de ponto flutuante (ex.: 1.4999999 → 1.5).
 */
export function normalizePoints(points) {
  return Math.round(points * 10) / 10
}

/**
 * Formata pontos para exibição (pt-BR: vírgula como separador decimal).
 */
export function formatPoints(points) {
  const normalized = normalizePoints(points)
  if (Number.isInteger(normalized)) return String(normalized)
  return normalized.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/**
 * Classe CSS do badge de pontos (evita tokens inválidos como "pts-1.5").
 */
export function pointsBadgeClass(points) {
  if (points <= 0) return 'pts-0'

  const tiers = [25, 20, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
  const value = Number.isInteger(points) ? points : Math.floor(points)

  for (const tier of tiers) {
    if (value >= tier) return `pts-${tier}`
  }

  return 'pts-1'
}

/**
 * Calcula os pontos finais aplicando o multiplicador de fase.
 *
 * @param {object} bet    - { homeGoals, awayGoals }
 * @param {object} result - { homeGoals, awayGoals }
 * @param {string} phase  - chave de PHASE_CONFIG
 * @returns {number} pontos finais
 */
export function calcPoints(bet, result, phase) {
  const base = calcBasePoints(bet, result)
  const multiplier = PHASE_CONFIG[phase]?.multiplier ?? 1
  return normalizePoints(base * multiplier)
}

/**
 * Calcula o placar de um jogador a partir de seus palpites e resultados conhecidos.
 *
 * @param {string} playerId
 * @param {object[]} bets    - array de { matchId, homeGoals, awayGoals }
 * @param {object[]} results - array de { matchId, homeGoals, awayGoals }
 * @param {object[]} matches - array de { id, phase }
 * @returns {{ total: number, exactHits: number, scoredHits: number, breakdown: object[] }}
 */
export function calcPlayerScore(playerId, bets, results, matches) {
  const betMap    = Object.fromEntries(bets.map(b => [b.matchId, b]))
  const resultMap = Object.fromEntries(results.map(r => [r.matchId, r]))

  let total = 0
  let exactHits = 0
  let scoredHits = 0
  const breakdown = []

  for (const match of matches) {
    const result = resultMap[match.id]
    if (!result) continue // jogo sem resultado ainda, pula

    const bet = betMap[match.id]
    const points = bet ? calcPoints(bet, result, match.phase) : 0
    const base   = bet ? calcBasePoints(bet, result) : 0

    total += points
    if (base === 5) exactHits += 1
    if (points > 0) scoredHits += 1
    breakdown.push({
      matchId: match.id,
      phase: match.phase,
      bet: bet ?? null,
      result,
      basePoints: base,
      multiplier: PHASE_CONFIG[match.phase]?.multiplier ?? 1,
      points,
    })
  }

  return { total, exactHits, scoredHits, breakdown }
}

/**
 * Compara dois jogadores pelo critério oficial do ranking.
 * Ordem: pontos totais, placares exatos, jogos pontuados.
 *
 * @param {object} left
 * @param {object} right
 * @returns {number}
 */
export function compareRankingEntries(left, right) {
  return (
    right.total - left.total ||
    right.exactHits - left.exactHits ||
    right.scoredHits - left.scoredHits
  )
}

/**
 * Atribui posições ao ranking, preservando empate real quando os critérios
 * de desempate ainda não separarem dois participantes.
 *
 * @param {object[]} ranking
 * @returns {object[]}
 */
export function withRankingPositions(ranking) {
  return ranking.reduce((acc, player, index) => {
    const previous = acc[index - 1]
    const position = previous && compareRankingEntries(previous, player) === 0
      ? previous.position
      : index + 1

    acc.push({ ...player, position })
    return acc
  }, [])
}

/**
 * Gera o ranking de todos os jogadores.
 *
 * @param {object[]} players - [{ id, name }]
 * @param {object}   betsDB  - { [playerId]: [{ matchId, homeGoals, awayGoals }] }
 * @param {object[]} results - [{ matchId, homeGoals, awayGoals }]
 * @param {object[]} matches - [{ id, phase }]
 * @returns {object[]} jogadores ordenados por pontos, exatos e jogos pontuados
 */
export function calcRanking(players, betsDB, results, matches) {
  return players
    .map(player => {
      const bets  = betsDB[player.id] ?? []
      const score = calcPlayerScore(player.id, bets, results, matches)
      return { ...player, ...score }
    })
    .sort(compareRankingEntries)
}

/**
 * Impacto de um jogo no ranking: posição antes/depois do resultado desse match.
 *
 * @param {object[]} players
 * @param {object} betsDB
 * @param {object[]} results
 * @param {object[]} matches
 * @param {string} matchId
 * @returns {Record<string, { positionBefore: number, positionAfter: number, delta: number, hasResult: boolean }>}
 */
export function calcMatchRankingImpact(players, betsDB, results, matches, matchId) {
  const resultsWithoutMatch = results.filter(result => result.matchId !== matchId)
  const rankingBefore = withRankingPositions(calcRanking(players, betsDB, resultsWithoutMatch, matches))
  const matchResult = results.find(result => result.matchId === matchId)

  const rankingAfter = matchResult
    ? withRankingPositions(calcRanking(players, betsDB, results, matches))
    : rankingBefore

  const beforeById = Object.fromEntries(rankingBefore.map(entry => [entry.id, entry.position]))
  const afterById = Object.fromEntries(rankingAfter.map(entry => [entry.id, entry.position]))
  const fallbackPosition = players.length || 1

  return Object.fromEntries(players.map(player => {
    const positionBefore = beforeById[player.id] ?? fallbackPosition
    const positionAfter = afterById[player.id] ?? fallbackPosition

    return [player.id, {
      positionBefore,
      positionAfter,
      delta: positionBefore - positionAfter,
      hasResult: !!matchResult,
    }]
  }))
}
/**
 * Gera a evolução do ranking após cada resultado lançado.
 *
 * @param {object[]} players
 * @param {object} betsDB
 * @param {object[]} results
 * @param {object[]} matches
 * @returns {object[]}
 */
export function calcRankingHistory(players, betsDB, results, matches) {
  const resultMap = Object.fromEntries(results.map(result => [result.matchId, result]))
  const completedMatches = matches.filter(match => !!resultMap[match.id])
  const partialResults = []
  const snapshots = []

  for (const match of completedMatches) {
    partialResults.push(resultMap[match.id])

    snapshots.push({
      matchId: match.id,
      phase: match.phase,
      date: match.date,
      ranking: withRankingPositions(calcRanking(players, betsDB, partialResults, matches)),
    })
  }

  return snapshots
}
