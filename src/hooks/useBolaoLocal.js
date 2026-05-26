import { useCallback, useEffect, useState } from 'react'
import { MATCHES, applyMatchSchedule, getBetDeadline } from '../data/matches.js'
import { resolveTournamentMatches } from '../utils/tournament.js'

const STORAGE_KEYS = {
  players: 'bolao.players',
  bets: 'bolao.bets',
  results: 'bolao.results',
  matchOverrides: 'bolao.matchOverrides',
  matchSchedule: 'bolao.matchSchedule',
}

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    console.error(`[LocalStorage] Falha ao ler ${key}:`, error)
    return fallback
  }
}

function writeJSON(key, value) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[LocalStorage] Falha ao salvar ${key}:`, error)
  }
}

function upsertByMatchId(items, nextItem) {
  const existingIndex = items.findIndex(item => item.matchId === nextItem.matchId)

  if (existingIndex === -1) {
    return [...items, nextItem]
  }

  return items.map(item => item.matchId === nextItem.matchId ? nextItem : item)
}

const LOCAL_FALLBACK_USER = {
  uid: 'local-user',
  email: 'modo-local@local',
}

function validateScheduleDate(date) {
  if (!date || Number.isNaN(new Date(date).getTime())) {
    throw new Error('Informe uma data/hora valida para o jogo.')
  }
}

export function useBolaoLocal(currentUser = LOCAL_FALLBACK_USER) {
  const [players, setPlayers] = useState(() => readJSON(STORAGE_KEYS.players, []))
  const [bets, setBets] = useState(() => readJSON(STORAGE_KEYS.bets, {}))
  const [results, setResults] = useState(() => readJSON(STORAGE_KEYS.results, []))
  const [matchOverrides, setMatchOverrides] = useState(() => readJSON(STORAGE_KEYS.matchOverrides, {}))
  const [matchSchedule, setMatchSchedule] = useState(() => readJSON(STORAGE_KEYS.matchSchedule, {}))
  const currentUid = currentUser?.uid ?? LOCAL_FALLBACK_USER.uid
  const currentPlayer = players.find(player => player.id === currentUid) ?? null
  const scheduledMatches = applyMatchSchedule(MATCHES, matchSchedule)
  const matches = resolveTournamentMatches(results, matchOverrides, scheduledMatches)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.players, players)
  }, [players])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.bets, bets)
  }, [bets])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.results, results)
  }, [results])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.matchOverrides, matchOverrides)
  }, [matchOverrides])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.matchSchedule, matchSchedule)
  }, [matchSchedule])

  const saveOwnProfile = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nome inválido' }

    if (players.some(player =>
      player.id !== currentUid &&
      player.name?.toLowerCase() === trimmed.toLowerCase()
    )) {
      return { ok: false, error: 'Jogador já cadastrado' }
    }

    setPlayers(current => {
      const existing = current.find(player => player.id === currentUid)
      const nextPlayer = {
        id: currentUid,
        name: trimmed,
        email: currentUser?.email ?? '',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      }

      if (existing) {
        return current.map(player => player.id === currentUid ? nextPlayer : player)
      }

      return [...current, nextPlayer]
    })

    return { ok: true }
  }, [currentUid, currentUser?.email, players])

  const placeBet = useCallback(async (matchId, homeGoals, awayGoals) => {
    const nextBet = {
      matchId,
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      placedAt: new Date().toISOString(),
    }

    setBets(current => ({
      ...current,
      [currentUid]: upsertByMatchId(current[currentUid] ?? [], nextBet),
    }))
  }, [currentUid])

  const removeBet = useCallback(async (matchId) => {
    setBets(current => ({
      ...current,
      [currentUid]: (current[currentUid] ?? []).filter(bet => bet.matchId !== matchId),
    }))
  }, [currentUid])

  const getOwnBet = useCallback((matchId) => {
    return (bets[currentUid] ?? []).find(bet => bet.matchId === matchId) ?? null
  }, [bets, currentUid])

  const getVisibleBets = useCallback((matchId) => {
    return players.map(player => ({
      player,
      bet: (bets[player.id] ?? []).find(item => item.matchId === matchId) ?? null,
    }))
  }, [bets, players])

  const setResult = useCallback(async (matchId, homeGoals, awayGoals, winnerSide = null) => {
    const nextResult = {
      matchId,
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      setAt: new Date().toISOString(),
    }

    if (winnerSide) {
      nextResult.winnerSide = winnerSide
    }

    setResults(current => upsertByMatchId(current, nextResult))
  }, [])

  const removeResult = useCallback(async (matchId) => {
    setResults(current => current.filter(result => result.matchId !== matchId))
  }, [])

  const saveMatchOverride = useCallback(async (matchId, home, away) => {
    const trimmedHome = home.trim()
    const trimmedAway = away.trim()

    if (!trimmedHome || !trimmedAway) {
      throw new Error('Informe os dois times para salvar o ajuste manual.')
    }

    setMatchOverrides(current => ({
      ...current,
      [matchId]: {
        home: trimmedHome,
        away: trimmedAway,
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const clearMatchOverride = useCallback(async (matchId) => {
    setMatchOverrides(current => {
      const next = { ...current }
      delete next[matchId]
      return next
    })
  }, [])

  const saveMatchSchedule = useCallback(async (matchId, date) => {
    validateScheduleDate(date)

    setMatchSchedule(current => ({
      ...current,
      [matchId]: {
        date,
        deadlineMs: getBetDeadline(date).getTime(),
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const clearMatchSchedule = useCallback(async (matchId) => {
    setMatchSchedule(current => {
      const next = { ...current }
      delete next[matchId]
      return next
    })
  }, [])

  const getResult = useCallback((matchId) => {
    return results.find(result => result.matchId === matchId) ?? null
  }, [results])

  return {
    players,
    bets,
    results,
    matchOverrides,
    matchSchedule,
    matches,
    loading: false,
    error: null,
    storageMode: 'local',
    storageLabel: 'Modo local',
    currentPlayer,
    saveOwnProfile,
    placeBet,
    removeBet,
    getOwnBet,
    getVisibleBets,
    setResult,
    removeResult,
    saveMatchOverride,
    clearMatchOverride,
    saveMatchSchedule,
    clearMatchSchedule,
    getResult,
  }
}
