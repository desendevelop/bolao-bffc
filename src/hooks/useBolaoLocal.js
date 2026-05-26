import { useCallback, useEffect, useState } from 'react'
import { resolveTournamentMatches } from '../utils/tournament.js'

const STORAGE_KEYS = {
  players: 'bolao.players',
  bets: 'bolao.bets',
  results: 'bolao.results',
  matchOverrides: 'bolao.matchOverrides',
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

export function useBolaoLocal(currentUser = LOCAL_FALLBACK_USER) {
  const [players, setPlayers] = useState(() => readJSON(STORAGE_KEYS.players, []))
  const [bets, setBets] = useState(() => readJSON(STORAGE_KEYS.bets, {}))
  const [results, setResults] = useState(() => readJSON(STORAGE_KEYS.results, []))
  const [matchOverrides, setMatchOverrides] = useState(() => readJSON(STORAGE_KEYS.matchOverrides, {}))
  const currentUid = currentUser?.uid ?? LOCAL_FALLBACK_USER.uid
  const currentPlayer = players.find(player => player.id === currentUid) ?? null
  const matches = resolveTournamentMatches(results, matchOverrides)

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

  const getOwnBet = useCallback((matchId) => {
    return (bets[currentUid] ?? []).find(bet => bet.matchId === matchId) ?? null
  }, [bets, currentUid])

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

  const getResult = useCallback((matchId) => {
    return results.find(result => result.matchId === matchId) ?? null
  }, [results])

  return {
    players,
    bets,
    results,
    matchOverrides,
    matches,
    loading: false,
    error: null,
    storageMode: 'local',
    storageLabel: 'Modo local',
    currentPlayer,
    saveOwnProfile,
    placeBet,
    getOwnBet,
    setResult,
    removeResult,
    saveMatchOverride,
    clearMatchOverride,
    getResult,
  }
}
