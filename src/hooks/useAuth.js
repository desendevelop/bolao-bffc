import { useCallback, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { get, onValue, ref, set } from 'firebase/database'
import { auth, db, firebaseInitError, isFirebaseConfigured } from '../services/firebase.js'

const LOCAL_USER = {
  uid: 'local-user',
  email: 'modo-local@local',
  displayName: 'Modo local',
}

function formatAuthError(error) {
  const code = error?.code ?? ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.'
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.'
    case 'auth/missing-email':
      return 'Informe o e-mail da conta para recuperar o acesso.'
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.'
    case 'auth/operation-not-allowed':
      return 'Ative o provedor Email/Password em Firebase Authentication antes de usar o login.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    default:
      if (String(error?.message).includes('CONFIGURATION_NOT_FOUND')) {
        return 'Ative o provedor Email/Password em Firebase Authentication antes de usar o login.'
      }
      return error?.message ?? 'Não foi possível autenticar.'
  }
}

export function useAuth() {
  const [user, setUser] = useState(isFirebaseConfigured ? null : LOCAL_USER)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [pending, setPending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(!isFirebaseConfigured)
  const [adminReady, setAdminReady] = useState(!isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || firebaseInitError) {
      setAuthReady(true)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, nextUser => {
      setUser(nextUser)
      setAuthReady(true)
      setIsAdmin(false)
      setAdminReady(!nextUser)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user || user.uid === LOCAL_USER.uid) {
      return
    }

    setAdminReady(false)
    const adminRef = ref(db, `admins/${user.uid}`)
    const unsubscribe = onValue(adminRef, snap => {
      setIsAdmin(snap.val() === true)
      setAdminReady(true)
    }, () => {
      setIsAdmin(false)
      setAdminReady(true)
    })

    return unsubscribe
  }, [user?.uid])

  const signIn = useCallback(async ({ email, password }) => {
    if (!auth) {
      return { ok: false, error: 'Firebase Auth não está disponível.' }
    }

    setPending(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: formatAuthError(error) }
    } finally {
      setPending(false)
    }
  }, [])

  const signUp = useCallback(async ({ name, email, password }) => {
    if (!auth || !db) {
      return { ok: false, error: 'Firebase não está disponível.' }
    }

    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (trimmedName.length < 2) {
      return { ok: false, error: 'Informe um nome com pelo menos 2 caracteres.' }
    }

    setPending(true)
    try {
      const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      const playersSnap = await get(ref(db, 'players'))
      const players = Object.entries(playersSnap.val() ?? {})
      const duplicated = players.some(([uid, player]) =>
        uid !== credentials.user.uid &&
        player?.name?.toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicated) {
        await deleteUser(credentials.user)
        return { ok: false, error: 'Já existe um participante com esse nome.' }
      }

      await updateProfile(credentials.user, { displayName: trimmedName }).catch(() => {})
      await set(ref(db, `players/${credentials.user.uid}`), {
        name: trimmedName,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
      })

      return { ok: true }
    } catch (error) {
      return { ok: false, error: formatAuthError(error) }
    } finally {
      setPending(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) return
    await firebaseSignOut(auth)
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!auth) {
      return { ok: false, error: 'Firebase Auth não está disponível.' }
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      return { ok: false, error: 'Informe o e-mail da conta para recuperar o acesso.' }
    }

    setPending(true)
    try {
      await sendPasswordResetEmail(auth, normalizedEmail)
      return {
        ok: true,
        message: 'Se o e-mail existir, o Firebase enviará um link para redefinir a senha.',
      }
    } catch (error) {
      return { ok: false, error: formatAuthError(error) }
    } finally {
      setPending(false)
    }
  }, [])

  return {
    user,
    authReady,
    pending,
    isAdmin,
    adminReady,
    signIn,
    signUp,
    resetPassword,
    signOut,
  }
}
