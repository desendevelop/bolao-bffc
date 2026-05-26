/**
 * useBolao.js — Hook principal do bolão com Firebase Realtime Database
 *
 * Interface pública idêntica à versão com localStorage:
 * os componentes não precisam saber que o backend mudou.
 *
 * Sincronização:
 *   - onValue() → listener em tempo real; qualquer mudança no RTDB
 *     chega instantaneamente a todos os clientes conectados.
 *   - set/update/remove → escrita otimista; o listener reage e
 *     atualiza o estado local.
 *
 * Offline:
 *   O Firebase SDK tem cache offline embutido. Operações feitas sem
 *   conexão são enfileiradas e sincronizadas quando a conexão voltar.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { db, firebaseInitError, isFirebaseConfigured } from '../services/firebase.js'
import { useBolaoLocal } from './useBolaoLocal.js'
import { createId } from '../utils/id.js'
import {
  ref,
  onValue,
  off,
  set,
  remove,
  update,
} from 'firebase/database'

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

// ── Hook ──────────────────────────────────────────────────────────────────

function useBolaoFirebase() {
  const [players, setPlayers] = useState([])
  const [bets,    setBets]    = useState({})   // { [playerId]: [{ matchId, homeGoals, awayGoals }] }
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(!firebaseInitError)
  const [error,   setError]   = useState(firebaseInitError?.message ?? null)

  // Guarda os unsubscribers para cleanup no unmount
  const listenersRef = useRef([])

  useEffect(() => {
    if (firebaseInitError || !db) {
      setLoading(false)
      return
    }

    const listeners = listenersRef.current

    // ── Players ────────────────────────────────────────────────────────────
    const playersRef = ref(db, 'players')
    const unsubPlayers = onValue(playersRef, snap => {
      setPlayers(objToArray(snap.val()))
      setLoading(false)
    }, err => {
      console.error('[Firebase] players:', err)
      setError(err.message)
      setLoading(false)
    })
    listeners.push(() => off(playersRef, 'value', unsubPlayers))

    // ── Bets ───────────────────────────────────────────────────────────────
    const betsRef = ref(db, 'bets')
    const unsubBets = onValue(betsRef, snap => {
      const raw = snap.val() ?? {}
      // raw = { [playerId]: { [matchId]: { homeGoals, awayGoals, placedAt } } }
      const normalized = {}
      for (const [playerId, playerBets] of Object.entries(raw)) {
        normalized[playerId] = betsObjToArray(playerBets)
      }
      setBets(normalized)
    }, err => console.error('[Firebase] bets:', err))
    listeners.push(() => off(betsRef, 'value', unsubBets))

    // ── Results ────────────────────────────────────────────────────────────
    const resultsRef = ref(db, 'results')
    const unsubResults = onValue(resultsRef, snap => {
      setResults(resultsObjToArray(snap.val()))
    }, err => console.error('[Firebase] results:', err))
    listeners.push(() => off(resultsRef, 'value', unsubResults))

    return () => listeners.forEach(fn => fn())
  }, [])

  // ── Jogadores ────────────────────────────────────────────────────────────

  const addPlayer = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nome inválido' }

    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'Jogador já cadastrado' }
    }

    const id = createId()
    await set(ref(db, `players/${id}`), {
      name: trimmed,
      createdAt: new Date().toISOString(),
    })
    return { ok: true }
  }, [players])

  const removePlayer = useCallback(async (id) => {
    await remove(ref(db, `players/${id}`))
    await remove(ref(db, `bets/${id}`))
  }, [])

  // ── Palpites ─────────────────────────────────────────────────────────────

  const placeBet = useCallback(async (playerId, matchId, homeGoals, awayGoals) => {
    await set(ref(db, `bets/${playerId}/${matchId}`), {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      placedAt: new Date().toISOString(),
    })
  }, [])

  const removeBet = useCallback(async (playerId, matchId) => {
    await remove(ref(db, `bets/${playerId}/${matchId}`))
  }, [])

  const getBet = useCallback((playerId, matchId) => {
    return (bets[playerId] ?? []).find(b => b.matchId === matchId) ?? null
  }, [bets])

  // ── Resultados ────────────────────────────────────────────────────────────

  const setResult = useCallback(async (matchId, homeGoals, awayGoals) => {
    await set(ref(db, `results/${matchId}`), {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      setAt: new Date().toISOString(),
    })
  }, [])

  const removeResult = useCallback(async (matchId) => {
    await remove(ref(db, `results/${matchId}`))
  }, [])

  const getResult = useCallback((matchId) => {
    return results.find(r => r.matchId === matchId) ?? null
  }, [results])

  // ── Export ────────────────────────────────────────────────────────────────

  return {
    players,
    bets,
    results,
    loading,
    error,
    storageMode: 'firebase',
    storageLabel: 'Firebase',
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

export function useBolao() {
  if (!isFirebaseConfigured) {
    return useBolaoLocal()
  }

  return useBolaoFirebase()
}
