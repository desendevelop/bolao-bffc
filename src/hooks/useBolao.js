import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onValue, ref, remove, set } from 'firebase/database'
import { db, firebaseInitError, isFirebaseConfigured } from '../services/firebase.js'
import { useBolaoLocal } from './useBolaoLocal.js'
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

function formatWriteError(error) {
  if (error?.code === 'PERMISSION_DENIED') {
    return 'Já era, você DANILOU'
  }

  return error?.message ?? 'Não foi possível salvar no Firebase.'
}

function useBolaoFirebase(currentUser, authReady) {
  const [players, setPlayers] = useState([])
  const [bets, setBets] = useState({})
  const [results, setResults] = useState([])
  const [matchOverrides, setMatchOverrides] = useState({})
  const [loading, setLoading] = useState(!firebaseInitError)
  const [error, setError] = useState(firebaseInitError?.message ?? null)
  const listenersRef = useRef([])
  const currentUid = currentUser?.uid ?? null
  const currentPlayer = useMemo(
    () => players.find(player => player.id === currentUid) ?? null,
    [players, currentUid]
  )
  const matches = useMemo(
    () => resolveTournamentMatches(results, matchOverrides),
    [results, matchOverrides]
  )

  useEffect(() => {
    listenersRef.current.forEach(unsubscribe => unsubscribe())
    listenersRef.current = []

    if (firebaseInitError || !db || !authReady) {
      setLoading(!authReady)
      if (firebaseInitError) {
        setError(firebaseInitError.message)
      }
      return
    }

    if (!currentUid) {
      setPlayers([])
      setBets({})
      setResults([])
      setMatchOverrides({})
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

    const betsRef = ref(db, 'bets')
    listeners.push(onValue(betsRef, snap => {
      const raw = snap.val() ?? {}
      const normalized = {}
      for (const [playerId, playerBets] of Object.entries(raw)) {
        normalized[playerId] = betsObjToArray(playerBets)
      }
      setBets(normalized)
    }, err => {
      console.error('[Firebase] bets:', err)
      setError(err.message)
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

    listenersRef.current = listeners
    return () => listeners.forEach(unsubscribe => unsubscribe())
  }, [authReady, currentUid])

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

  const getOwnBet = useCallback((matchId) => {
    if (!currentUid) return null
    return (bets[currentUid] ?? []).find(bet => bet.matchId === matchId) ?? null
  }, [bets, currentUid])

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

  const getResult = useCallback((matchId) => {
    return results.find(r => r.matchId === matchId) ?? null
  }, [results])

  return {
    players,
    bets,
    results,
    matchOverrides,
    matches,
    loading,
    error,
    storageMode: 'firebase',
    storageLabel: 'Firebase',
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

export function useBolao(currentUser, authReady = true) {
  if (!isFirebaseConfigured) {
    return useBolaoLocal(currentUser)
  }

  return useBolaoFirebase(currentUser, authReady)
}
