import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEYS = {
  players: 'bolao.players',
  bets: 'bolao.bets',
  results: 'bolao.results',
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

export function useBolaoLocal() {
  const [players, setPlayers] = useState(() => readJSON(STORAGE_KEYS.players, []))
  const [bets, setBets] = useState(() => readJSON(STORAGE_KEYS.bets, {}))
  const [results, setResults] = useState(() => readJSON(STORAGE_KEYS.results, []))

  useEffect(() => {
    writeJSON(STORAGE_KEYS.players, players)
  }, [players])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.bets, bets)
  }, [bets])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.results, results)
  }, [results])

  const addPlayer = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nome inválido' }

    if (players.some(player => player.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'Jogador já cadastrado' }
    }

    setPlayers(current => [...current, {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }])

    return { ok: true }
  }, [players])

  const removePlayer = useCallback(async (id) => {
    setPlayers(current => current.filter(player => player.id !== id))
    setBets(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const placeBet = useCallback(async (playerId, matchId, homeGoals, awayGoals) => {
    const nextBet = {
      matchId,
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      placedAt: new Date().toISOString(),
    }

    setBets(current => ({
      ...current,
      [playerId]: upsertByMatchId(current[playerId] ?? [], nextBet),
    }))
  }, [])

  const removeBet = useCallback(async (playerId, matchId) => {
    setBets(current => ({
      ...current,
      [playerId]: (current[playerId] ?? []).filter(bet => bet.matchId !== matchId),
    }))
  }, [])

  const getBet = useCallback((playerId, matchId) => {
    return (bets[playerId] ?? []).find(bet => bet.matchId === matchId) ?? null
  }, [bets])

  const setResult = useCallback(async (matchId, homeGoals, awayGoals) => {
    const nextResult = {
      matchId,
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      setAt: new Date().toISOString(),
    }

    setResults(current => upsertByMatchId(current, nextResult))
  }, [])

  const removeResult = useCallback(async (matchId) => {
    setResults(current => current.filter(result => result.matchId !== matchId))
  }, [])

  const getResult = useCallback((matchId) => {
    return results.find(result => result.matchId === matchId) ?? null
  }, [results])

  return {
    players,
    bets,
    results,
    loading: false,
    error: null,
    storageMode: 'local',
    storageLabel: 'Modo local',
    addPlayer,
    removePlayer,
    placeBet,
    removeBet,
    getBet,
    setResult,
    removeResult,
    getResult,
  }
}
