import { MATCHES } from '../data/matches.js'
import { THIRD_PLACE_SCENARIOS } from '../data/thirdPlaceScenarios.js'
import { getWinner } from './scoring.js'

const GROUPS = 'ABCDEFGHIJKL'.split('')

const MATCH_MAP = Object.fromEntries(MATCHES.map(match => [match.id, match]))

const GROUP_MATCHES_BY_GROUP = Object.fromEntries(
  GROUPS.map(group => [
    group,
    MATCHES.filter(match => match.phase === 'group' && match.group === group),
  ])
)

const GROUP_TEAMS_BY_GROUP = Object.fromEntries(
  GROUPS.map(group => {
    const teams = []
    for (const match of GROUP_MATCHES_BY_GROUP[group]) {
      if (!teams.includes(match.home)) teams.push(match.home)
      if (!teams.includes(match.away)) teams.push(match.away)
    }
    return [group, teams]
  })
)

const ROUND_OF_32_SOURCES = {
  R01: { home: { type: 'groupRank', group: 'A', rank: 2 }, away: { type: 'groupRank', group: 'B', rank: 2 } },
  R02: { home: { type: 'groupRank', group: 'C', rank: 1 }, away: { type: 'groupRank', group: 'F', rank: 2 } },
  R03: { home: { type: 'groupRank', group: 'E', rank: 1 }, away: { type: 'bestThird', slot: 'E' } },
  R04: { home: { type: 'groupRank', group: 'F', rank: 1 }, away: { type: 'groupRank', group: 'C', rank: 2 } },
  R05: { home: { type: 'groupRank', group: 'E', rank: 2 }, away: { type: 'groupRank', group: 'I', rank: 2 } },
  R06: { home: { type: 'groupRank', group: 'I', rank: 1 }, away: { type: 'bestThird', slot: 'I' } },
  R07: { home: { type: 'groupRank', group: 'A', rank: 1 }, away: { type: 'bestThird', slot: 'A' } },
  R08: { home: { type: 'groupRank', group: 'L', rank: 1 }, away: { type: 'bestThird', slot: 'L' } },
  R09: { home: { type: 'groupRank', group: 'G', rank: 1 }, away: { type: 'bestThird', slot: 'G' } },
  R10: { home: { type: 'groupRank', group: 'D', rank: 1 }, away: { type: 'bestThird', slot: 'D' } },
  R11: { home: { type: 'groupRank', group: 'B', rank: 1 }, away: { type: 'bestThird', slot: 'B' } },
  R12: { home: { type: 'groupRank', group: 'H', rank: 1 }, away: { type: 'groupRank', group: 'J', rank: 2 } },
  R13: { home: { type: 'groupRank', group: 'K', rank: 2 }, away: { type: 'groupRank', group: 'L', rank: 2 } },
  R14: { home: { type: 'groupRank', group: 'D', rank: 2 }, away: { type: 'groupRank', group: 'G', rank: 2 } },
  R15: { home: { type: 'groupRank', group: 'J', rank: 1 }, away: { type: 'groupRank', group: 'H', rank: 2 } },
  R16: { home: { type: 'groupRank', group: 'K', rank: 1 }, away: { type: 'bestThird', slot: 'K' } },
}

const KNOCKOUT_SOURCES = {
  ...ROUND_OF_32_SOURCES,
  O01: { home: { type: 'winner', matchId: 'R01' }, away: { type: 'winner', matchId: 'R04' } },
  O02: { home: { type: 'winner', matchId: 'R03' }, away: { type: 'winner', matchId: 'R06' } },
  O03: { home: { type: 'winner', matchId: 'R02' }, away: { type: 'winner', matchId: 'R05' } },
  O04: { home: { type: 'winner', matchId: 'R07' }, away: { type: 'winner', matchId: 'R08' } },
  O05: { home: { type: 'winner', matchId: 'R13' }, away: { type: 'winner', matchId: 'R12' } },
  O06: { home: { type: 'winner', matchId: 'R10' }, away: { type: 'winner', matchId: 'R09' } },
  O07: { home: { type: 'winner', matchId: 'R15' }, away: { type: 'winner', matchId: 'R14' } },
  O08: { home: { type: 'winner', matchId: 'R11' }, away: { type: 'winner', matchId: 'R16' } },
  Q01: { home: { type: 'winner', matchId: 'O02' }, away: { type: 'winner', matchId: 'O01' } },
  Q02: { home: { type: 'winner', matchId: 'O05' }, away: { type: 'winner', matchId: 'O06' } },
  Q03: { home: { type: 'winner', matchId: 'O03' }, away: { type: 'winner', matchId: 'O04' } },
  Q04: { home: { type: 'winner', matchId: 'O07' }, away: { type: 'winner', matchId: 'O08' } },
  S01: { home: { type: 'winner', matchId: 'Q01' }, away: { type: 'winner', matchId: 'Q02' } },
  S02: { home: { type: 'winner', matchId: 'Q03' }, away: { type: 'winner', matchId: 'Q04' } },
  T01: { home: { type: 'loser', matchId: 'S01' }, away: { type: 'loser', matchId: 'S02' } },
  F01: { home: { type: 'winner', matchId: 'S01' }, away: { type: 'winner', matchId: 'S02' } },
}

const KNOCKOUT_ORDER = Object.keys(KNOCKOUT_SOURCES)

function createTeamStats(teams) {
  return Object.fromEntries(
    teams.map(team => [
      team,
      {
        team,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
    ])
  )
}

function applyResult(stats, homeTeam, awayTeam, result) {
  const home = stats[homeTeam]
  const away = stats[awayTeam]
  if (!home || !away || !result) return

  home.played += 1
  away.played += 1
  home.goalsFor += result.homeGoals
  home.goalsAgainst += result.awayGoals
  away.goalsFor += result.awayGoals
  away.goalsAgainst += result.homeGoals
  home.goalDifference = home.goalsFor - home.goalsAgainst
  away.goalDifference = away.goalsFor - away.goalsAgainst

  const winner = getWinner(result.homeGoals, result.awayGoals)
  if (winner === 'home') {
    home.points += 3
  } else if (winner === 'away') {
    away.points += 3
  } else {
    home.points += 1
    away.points += 1
  }
}

function computeStatsForTeams(teams, matches, resultMap) {
  const stats = createTeamStats(teams)
  for (const match of matches) {
    const result = resultMap[match.id]
    if (!result) continue
    applyResult(stats, match.home, match.away, result)
  }
  return stats
}

function compareByTuple(left, right) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor
  )
}

function compareOverall(left, right, seedOrder) {
  return (
    compareByTuple(left, right) ||
    seedOrder.indexOf(left.team) - seedOrder.indexOf(right.team) ||
    left.team.localeCompare(right.team, 'pt-BR')
  )
}

function splitByTuple(teams, stats) {
  const partitions = []
  for (const team of teams) {
    const current = stats[team]
    const last = partitions[partitions.length - 1]
    const lastStats = last ? stats[last[0]] : null

    if (
      last &&
      lastStats.points === current.points &&
      lastStats.goalDifference === current.goalDifference &&
      lastStats.goalsFor === current.goalsFor
    ) {
      last.push(team)
    } else {
      partitions.push([team])
    }
  }
  return partitions
}

function resolveHeadToHeadTie(tiedTeams, groupMatches, resultMap, overallStats, seedOrder) {
  if (tiedTeams.length <= 1) return tiedTeams

  const h2hMatches = groupMatches.filter(match =>
    tiedTeams.includes(match.home) &&
    tiedTeams.includes(match.away) &&
    resultMap[match.id]
  )

  if (h2hMatches.length === 0) {
    return [...tiedTeams].sort((a, b) => compareOverall(overallStats[a], overallStats[b], seedOrder))
  }

  const h2hStats = computeStatsForTeams(tiedTeams, h2hMatches, resultMap)
  const ordered = [...tiedTeams].sort((a, b) => compareByTuple(h2hStats[a], h2hStats[b]))
  const partitions = splitByTuple(ordered, h2hStats)

  if (partitions.length === 1) {
    return [...tiedTeams].sort((a, b) => compareOverall(overallStats[a], overallStats[b], seedOrder))
  }

  return partitions.flatMap(partition => {
    if (partition.length === 1) return partition
    return resolveHeadToHeadTie(partition, groupMatches, resultMap, overallStats, seedOrder)
  })
}

function computeGroupStandings(group, resultMap) {
  const teams = GROUP_TEAMS_BY_GROUP[group]
  const matches = GROUP_MATCHES_BY_GROUP[group]
  const seedOrder = teams
  const overallStats = computeStatsForTeams(teams, matches, resultMap)
  const orderedByPoints = [...teams].sort((a, b) => compareByTuple(overallStats[a], overallStats[b]))
  const pointPartitions = splitByTuple(orderedByPoints, overallStats)

  const orderedTeams = pointPartitions.flatMap(partition => {
    if (partition.length === 1) return partition
    return resolveHeadToHeadTie(partition, matches, resultMap, overallStats, seedOrder)
  })

  return orderedTeams.map((team, index) => ({
    ...overallStats[team],
    group,
    rank: index + 1,
  }))
}

function isGroupComplete(group, resultMap) {
  return GROUP_MATCHES_BY_GROUP[group].every(match => !!resultMap[match.id])
}

function buildThirdPlaceRanking(groupStandings, groupCompletion) {
  const thirds = GROUPS
    .filter(group => groupCompletion[group])
    .map(group => groupStandings[group]?.[2])
    .filter(Boolean)

  return [...thirds].sort((left, right) => (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.group.localeCompare(right.group)
  ))
}

function createResolvedContext(results) {
  const resultMap = Object.fromEntries(results.map(result => [result.matchId, result]))
  const groupCompletion = Object.fromEntries(GROUPS.map(group => [group, isGroupComplete(group, resultMap)]))
  const groupStandings = Object.fromEntries(GROUPS.map(group => [group, computeGroupStandings(group, resultMap)]))
  const groupStageComplete = GROUPS.every(group => groupCompletion[group])
  const thirdPlaceRanking = groupStageComplete ? buildThirdPlaceRanking(groupStandings, groupCompletion) : []
  const qualifiedThirdGroups = thirdPlaceRanking.slice(0, 8).map(entry => entry.group).sort()
  const thirdScenarioKey = qualifiedThirdGroups.join('')
  const thirdScenario = groupStageComplete ? (THIRD_PLACE_SCENARIOS[thirdScenarioKey] ?? null) : null

  return {
    resultMap,
    groupCompletion,
    groupStandings,
    groupStageComplete,
    thirdPlaceRanking,
    thirdScenario,
  }
}

function resolveSource(source, context) {
  switch (source.type) {
    case 'groupRank': {
      if (!context.groupCompletion[source.group]) return null
      return context.groupStandings[source.group]?.[source.rank - 1]?.team ?? null
    }
    case 'bestThird': {
      if (!context.groupStageComplete || !context.thirdScenario) return null
      const group = context.thirdScenario[source.slot]
      return group ? context.groupStandings[group]?.[2]?.team ?? null : null
    }
    case 'winner':
      return context.knockoutWinners[source.matchId] ?? null
    case 'loser':
      return context.knockoutLosers[source.matchId] ?? null
    default:
      return null
  }
}

function resolveKnockoutWinner(match, result) {
  if (!match || !result || match.home === 'A definir' || match.away === 'A definir') {
    return { winner: null, loser: null }
  }

  const outcome = getWinner(result.homeGoals, result.awayGoals)
  if (outcome === 'draw') {
    if (result.winnerSide === 'home') {
      return { winner: match.home, loser: match.away }
    }
    if (result.winnerSide === 'away') {
      return { winner: match.away, loser: match.home }
    }
    return { winner: null, loser: null }
  }

  if (outcome === 'home') {
    return { winner: match.home, loser: match.away }
  }

  return { winner: match.away, loser: match.home }
}

export function resolveTournamentMatches(results, matchOverrides = {}, baseMatches = MATCHES) {
  const context = createResolvedContext(results)
  const resolvedMap = Object.fromEntries(baseMatches.map(match => [match.id, { ...match }]))

  context.knockoutWinners = {}
  context.knockoutLosers = {}

  for (const matchId of KNOCKOUT_ORDER) {
    const source = KNOCKOUT_SOURCES[matchId]
    const original = resolvedMap[matchId]
    if (!original) continue

    const home = resolveSource(source.home, context) ?? 'A definir'
    const away = resolveSource(source.away, context) ?? 'A definir'

    const override = matchOverrides[matchId] ?? null

    resolvedMap[matchId] = {
      ...original,
      home: override?.home?.trim?.() ? override.home.trim() : home,
      away: override?.away?.trim?.() ? override.away.trim() : away,
    }

    const outcome = resolveKnockoutWinner(resolvedMap[matchId], context.resultMap[matchId])
    context.knockoutWinners[matchId] = outcome.winner
    context.knockoutLosers[matchId] = outcome.loser
  }

  return baseMatches.map(match => resolvedMap[match.id] ?? match)
}
