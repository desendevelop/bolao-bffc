/**
 * firebase.js — Inicialização do Firebase
 *
 * As credenciais vêm de variáveis de ambiente (arquivo .env na raiz do projeto).
 * Veja .env.example para saber quais variáveis precisam ser definidas.
 *
 * Usamos o Firebase Realtime Database (RTDB) por ser o mais simples para
 * sincronização em tempo real sem servidor: os dados ficam na nuvem e todos
 * os clientes conectados recebem atualizações instantâneas via WebSocket.
 *
 * Estrutura do banco:
 *
 *   /players
 *     /{playerId}
 *       name: string
 *       createdAt: string (ISO 8601)
 *
 *   /bets
 *     /{playerId}
 *       /{matchId}
 *         homeGoals: number
 *         awayGoals: number
 *         placedAt: string (ISO 8601)
 *
 *   /results
 *     /{matchId}
 *       homeGoals: number
 *       awayGoals: number
 *       setAt: string (ISO 8601)
 */

import { initializeApp } from 'firebase/app'
import { getDatabase }   from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const PLACEHOLDER_VALUES = {
  apiKey: 'AIzaSy...',
  authDomain: 'seu-projeto.firebaseapp.com',
  databaseURL: 'https://seu-projeto-default-rtdb.firebaseio.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
}

function isPlaceholderValue(key, value) {
  if (!value) return true

  const trimmed = String(value).trim()
  if (!trimmed) return true

  return trimmed === PLACEHOLDER_VALUES[key]
}

// Valida que as variáveis de ambiente foram configuradas
const missing = Object.entries(firebaseConfig)
  .filter(([key, value]) => isPlaceholderValue(key, value))
  .map(([k]) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)

export const isFirebaseConfigured = missing.length === 0

export let firebaseInitError = null
export let app = null
export let db = null

if (missing.length > 0) {
  console.warn(
    '[Firebase] Variáveis de ambiente ausentes ou com placeholders:\n' +
    missing.join('\n') +
    '\n\nO app vai usar modo local até que o .env seja preenchido com valores reais.'
  )
} else {
  try {
    app = initializeApp(firebaseConfig)
    db  = getDatabase(app)
  } catch (error) {
    firebaseInitError = error
    console.error('[Firebase] Falha ao inicializar o app:', error)
  }
}
