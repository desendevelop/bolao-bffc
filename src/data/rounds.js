/**
 * Rodadas disponíveis para os destaques semanais/fase.
 * Grupos: G01–G24 (1), G25–G48 (2), G49–G72 (3).
 */

function groupMatchNumber(matchId) {
  const num = Number.parseInt(matchId.slice(1), 10)
  return Number.isFinite(num) ? num : 0
}

function isGroupRound(match, round) {
  if (match.phase !== 'group') return false
  const num = groupMatchNumber(match.id)
  if (round === 1) return num >= 1 && num <= 24
  if (round === 2) return num >= 25 && num <= 48
  if (round === 3) return num >= 49 && num <= 72
  return false
}

export const HIGHLIGHT_ROUNDS = [
  { id: 'group-1', label: 'Rodada 1', filter: match => isGroupRound(match, 1) },
  { id: 'group-2', label: 'Rodada 2', filter: match => isGroupRound(match, 2) },
  { id: 'group-3', label: 'Rodada 3', filter: match => isGroupRound(match, 3) },
  { id: 'r32', label: '16 avos', filter: match => match.phase === 'r32' },
  { id: 'r16', label: 'Oitavas', filter: match => match.phase === 'r16' },
  { id: 'qf', label: 'Quartas', filter: match => match.phase === 'qf' },
  { id: 'sf', label: 'Semifinal', filter: match => match.phase === 'sf' },
  { id: 'third', label: '3º lugar', filter: match => match.phase === 'third' },
  { id: 'final', label: 'Final', filter: match => match.phase === 'final' },
]

export function getHighlightRound(roundId) {
  return HIGHLIGHT_ROUNDS.find(round => round.id === roundId) ?? HIGHLIGHT_ROUNDS[0]
}

export function getRoundMatches(matches, roundId) {
  const round = getHighlightRound(roundId)
  return matches.filter(round.filter)
}

/**
 * Jogos contabilizados no destaque: do início da copa até o fim da rodada escolhida.
 * Ex.: Rodada 2 inclui todos os jogos das rodadas 1 e 2.
 */
export function getCumulativeMatchesThroughRound(matches, roundId) {
  const roundIndex = HIGHLIGHT_ROUNDS.findIndex(round => round.id === roundId)
  if (roundIndex === -1) return []

  const includedRoundIds = HIGHLIGHT_ROUNDS.slice(0, roundIndex + 1).map(round => round.id)
  const seen = new Set()
  const cumulative = []

  for (const includedRoundId of includedRoundIds) {
    for (const match of getRoundMatches(matches, includedRoundId)) {
      if (seen.has(match.id)) continue
      seen.add(match.id)
      cumulative.push(match)
    }
  }

  return cumulative
}

export function getRoundResultStatus(roundMatches, results) {
  const resultIds = new Set(results.map(result => result.matchId))
  const totalGames = roundMatches.length
  const gamesWithResult = roundMatches.filter(match => resultIds.has(match.id)).length

  return {
    totalGames,
    gamesWithResult,
    isComplete: totalGames > 0 && gamesWithResult === totalGames,
  }
}
