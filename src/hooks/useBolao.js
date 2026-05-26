import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onValue, ref, remove, set } from 'firebase/database'
import { db, firebaseInitError, isFirebaseConfigured } from '../services/firebase.js'
import { useBolaoLocal } from './useBolaoLocal.js'
import { MATCHES, applyMatchSchedule, getBetDeadline, isBettingOpen } from '../data/matches.js'
import { resolveTournamentMatches } from '../utils/tournament.js'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Converte objeto Firebase { id1: {...}, id2: {...} } → array */
function objToArray(obj) {
  if (!obj) return []
  return Object.entries(obj).map(([id, val]) => ({ id, ...val }))
}

/** Converte objeto Firebase { matchId1: {...}, matchId2: {...} } → array de bets */
function betsObjToArray(obj) {
  if (!obj) return []
  return Object.entries(obj).map(([matchId, val]) => ({ matchId, ...val }))
}

/** Converte objeto Firebase de results → array */
function resultsObjToArray(obj) {
  if (!obj) return []
  return Object.entries(obj).map(([matchId, val]) => ({ matchId, ...val }))
}

function normalizeMap(obj) {
  return obj ?? {}
}

function validateScheduleDate(date) {
  if (!date || Number.isNaN(new Date(date).getTime())) {
    throw new Error('Informe uma data/hora valida para o jogo.')
  }
}

function upsertByMatchId(items, nextItem) {
  const existingIndex = items.findIndex(item => item.matchId === nextItem.matchId)

  if (existingIndex === -1) {
    return [...items, nextItem]
  }

  return items.map(item => item.matchId === nextItem.matchId ? nextItem : item)
}

function formatWriteError(error) {
  if (error?.code === 'PERMISSION_DENIED') {
    return 'Já era, você DANILOU'
  }

  return error?.message ?? 'Não foi possível salvar no Firebase.'
}

function useBolaoFirebase(currentUser, authReady, canAccessBolao) {
  const [players, setPlayers] = useState([])
  const [bets, setBets] = useState({})
  const [results, setResults] = useState([])
  const [matchOverrides, setMatchOverrides] = useState({})
  const [matchSchedule, setMatchSchedule] = useState({})
  const [loading, setLoading] = useState(!firebaseInitError)
  const [error, setError] = useState(firebaseInitError?.message ?? null)
  const dataListenersRef = useRef([])
  const betListenersRef = useRef([])
  const [betRefreshTick, setBetRefreshTick] = useState(0)
  const currentUid = currentUser?.uid ?? null
  const scheduledMatches = useMemo(
    () => applyMatchSchedule(MATCHES, matchSchedule),
    [matchSchedule]
  )
  const currentPlayer = useMemo(
    () => players.find(player => player.id === currentUid) ?? null,
    [players, currentUid]
  )
  const matches = useMemo(
    () => resolveTournamentMatches(results, matchOverrides, scheduledMatches),
    [results, matchOverrides, scheduledMatches]
  )

  useEffect(() => {
    dataListenersRef.current.forEach(unsubscribe => unsubscribe())
    dataListenersRef.current = []

    if (firebaseInitError || !db || !authReady) {
      setLoading(!authReady)
      if (firebaseInitError) {
        setError(firebaseInitError.message)
      }
      return
    }

    if (!currentUid || !canAccessBolao) {
      setPlayers([])
      setBets({})
      setResults([])
      setMatchOverrides({})
      setMatchSchedule({})
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const listeners = []

    const playersRef = ref(db, 'players')
    listeners.push(onValue(playersRef, snap => {
      setPlayers(objToArray(snap.val()))
      setLoading(false)
    }, err => {
      console.error('[Firebase] players:', err)
      setError(err.message)
      setLoading(false)
    }))

    const resultsRef = ref(db, 'results')
    listeners.push(onValue(resultsRef, snap => {
      setResults(resultsObjToArray(snap.val()))
    }, err => {
      console.error('[Firebase] results:', err)
      setError(err.message)
    }))

    const overridesRef = ref(db, 'matchOverrides')
    listeners.push(onValue(overridesRef, snap => {
      setMatchOverrides(normalizeMap(snap.val()))
    }, err => {
      console.error('[Firebase] matchOverrides:', err)
      setError(err.message)
    }))

    const scheduleRef = ref(db, 'matchSchedule')
    listeners.push(onValue(scheduleRef, snap => {
      setMatchSchedule(normalizeMap(snap.val()))
    }, err => {
      console.error('[Firebase] matchSchedule:', err)
      setError(err.message)
    }))

    dataListenersRef.current = listeners
    return () => listeners.forEach(unsubscribe => unsubscribe())
  }, [authReady, canAccessBolao, currentUid])

  useEffect(() => {
    if (!authReady || !currentUid) return undefined

    const intervalId = window.setInterval(() => {
      setBetRefreshTick(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [authReady, currentUid])

  useEffect(() => {
    betListenersRef.current.forEach(unsubscribe => unsubscribe())
    betListenersRef.current = []

    if (firebaseInitError || !db || !authReady) {
      return
    }

    if (!currentUid || !canAccessBolao) {
      setBets({})
      return
    }

    const revealedMatchIds = matches
      .filter(match => !isBettingOpen(match.date))
      .map(match => match.id)
    const revealedMatchIdSet = new Set(revealedMatchIds)

    setBets(current => {
      const next = {
        [currentUid]: current[currentUid] ?? [],
      }

      for (const [playerId, playerBets] of Object.entries(current)) {
        if (playerId === currentUid) continue
        const filtered = (playerBets ?? []).filter(bet => revealedMatchIdSet.has(bet.matchId))
        if (filtered.length > 0) {
          next[playerId] = filtered
        }
      }

      return next
    })

    const listeners = []

    const ownBetsRef = ref(db, `bets/${currentUid}`)
    listeners.push(onValue(ownBetsRef, snap => {
      setBets(current => ({
        ...current,
        [currentUid]: betsObjToArray(snap.val()),
      }))
    }, err => {
      console.error('[Firebase] own bets:', err)
      setError(err.message)
    }))

    for (const player of players) {
      if (player.id === currentUid) continue

      for (const matchId of revealedMatchIds) {
        const publicBetRef = ref(db, `bets/${player.id}/${matchId}`)

        listeners.push(onValue(publicBetRef, snap => {
          setBets(current => {
            const nextPlayerBets = snap.exists()
              ? upsertByMatchId(current[player.id] ?? [], { matchId, ...snap.val() })
              : (current[player.id] ?? []).filter(bet => bet.matchId !== matchId)

            return {
              ...current,
              [player.id]: nextPlayerBets,
            }
          })
        }, err => {
          console.warn(`[Firebase] public bet ${player.id}/${matchId}:`, err)
        }))
      }
    }

    betListenersRef.current = listeners
    return () => listeners.forEach(unsubscribe => unsubscribe())
  }, [authReady, canAccessBolao, currentUid, matches, players, betRefreshTick])

  const saveOwnProfile = useCallback(async (name) => {
    if (!currentUid || !currentUser) {
      return { ok: false, error: 'Faça login para salvar seu perfil.' }
    }

    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nome inválido' }

    if (players.some(player =>
      player.id !== currentUid &&
      player.name?.toLowerCase() === trimmed.toLowerCase()
    )) {
      return { ok: false, error: 'Jogador já cadastrado' }
    }

    await set(ref(db, `players/${currentUid}`), {
      name: trimmed,
      email: currentUser.email ?? '',
      createdAt: currentPlayer?.createdAt ?? new Date().toISOString(),
    })

    return { ok: true }
  }, [currentPlayer?.createdAt, currentUid, currentUser, players])

  const placeBet = useCallback(async (matchId, homeGoals, awayGoals) => {
    if (!currentUid) {
      throw new Error('Faça login para salvar palpites.')
    }

    try {
      await set(ref(db, `bets/${currentUid}/${matchId}`), {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        placedAt: new Date().toISOString(),
      })
    } catch (error) {
      throw new Error(formatWriteError(error))
    }
  }, [currentUid])

  const removeBet = useCallback(async (matchId) => {
    if (!currentUid) {
      throw new Error('Faça login para apagar palpites.')
    }

    try {
      await remove(ref(db, `bets/${currentUid}/${matchId}`))
    } catch (error) {
      throw new Error(formatWriteError(error))
    }
  }, [currentUid])

  const getOwnBet = useCallback((matchId) => {
    if (!currentUid) return null
    return (bets[currentUid] ?? []).find(bet => bet.matchId === matchId) ?? null
  }, [bets, currentUid])

  const getVisibleBets = useCallback((matchId) => {
    return players.map(player => ({
      player,
      bet: (bets[player.id] ?? []).find(item => item.matchId === matchId) ?? null,
    }))
  }, [bets, players])

  const setResult = useCallback(async (matchId, homeGoals, awayGoals, winnerSide = null) => {
    const payload = {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      setAt: new Date().toISOString(),
    }

    if (winnerSide) {
      payload.winnerSide = winnerSide
    }

    await set(ref(db, `results/${matchId}`), payload)
  }, [])

  const removeResult = useCallback(async (matchId) => {
    await remove(ref(db, `results/${matchId}`))
  }, [])

  const saveMatchOverride = useCallback(async (matchId, home, away) => {
    const trimmedHome = home.trim()
    const trimmedAway = away.trim()

    if (!trimmedHome || !trimmedAway) {
      throw new Error('Informe os dois times para salvar o ajuste manual.')
    }

    await set(ref(db, `matchOverrides/${matchId}`), {
      home: trimmedHome,
      away: trimmedAway,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const clearMatchOverride = useCallback(async (matchId) => {
    await remove(ref(db, `matchOverrides/${matchId}`))
  }, [])

  const saveMatchSchedule = useCallback(async (matchId, date) => {
    validateScheduleDate(date)

    await set(ref(db, `matchSchedule/${matchId}`), {
      date,
      deadlineMs: getBetDeadline(date).getTime(),
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const clearMatchSchedule = useCallback(async (matchId) => {
    await remove(ref(db, `matchSchedule/${matchId}`))
  }, [])

  const getResult = useCallback((matchId) => {
    return results.find(r => r.matchId === matchId) ?? null
  }, [results])

  return {
    players,
    bets,
    results,
    matchOverrides,
    matchSchedule,
    matches,
    loading,
    error,
    storageMode: 'firebase',
    storageLabel: 'Firebase',
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

export function useBolao(currentUser, authReady = true, canAccessBolao = true) {
  if (!isFirebaseConfigured) {
    return useBolaoLocal(currentUser)
  }

  return useBolaoFirebase(currentUser, authReady, canAccessBolao)
}
