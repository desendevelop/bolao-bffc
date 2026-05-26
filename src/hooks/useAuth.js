import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { get, onValue, ref, remove, set } from 'firebase/database'
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

function objToArray(obj) {
  if (!obj) return []
  return Object.entries(obj).map(([id, value]) => ({ id, ...value }))
}

export function useAuth() {
  const [user, setUser] = useState(isFirebaseConfigured ? null : LOCAL_USER)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [pending, setPending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(!isFirebaseConfigured)
  const [adminReady, setAdminReady] = useState(!isFirebaseConfigured)
  const [accessRequest, setAccessRequest] = useState(isFirebaseConfigured ? null : {
    id: LOCAL_USER.uid,
    name: LOCAL_USER.displayName,
    email: LOCAL_USER.email,
    status: 'approved',
  })
  const [accessStatus, setAccessStatus] = useState(isFirebaseConfigured ? null : 'approved')
  const [accessReady, setAccessReady] = useState(!isFirebaseConfigured)
  const [accessRequests, setAccessRequests] = useState([])
  const [ownPlayerExists, setOwnPlayerExists] = useState(!isFirebaseConfigured)
  const requestBootstrapRef = useRef(new Set())

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
      setAccessRequest(null)
      setAccessStatus(nextUser ? null : null)
      setAccessReady(!nextUser)
      setAccessRequests([])
      setOwnPlayerExists(false)
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user || user.uid === LOCAL_USER.uid) {
      setAccessReady(true)
      if (!isFirebaseConfigured) {
        setAccessStatus('approved')
      }
      return
    }

    if (!adminReady) {
      return
    }

    setAccessReady(false)
    let requestLoaded = false
    let playerLoaded = false
    let requestValue = null
    let playerExists = false

    const maybeCreatePendingRequest = () => {
      if (requestBootstrapRef.current.has(user.uid)) return
      requestBootstrapRef.current.add(user.uid)

      const fallbackName =
        user.displayName?.trim() ||
        user.email?.split('@')[0] ||
        'Participante'

      set(ref(db, `accessRequests/${user.uid}`), {
        name: fallbackName,
        email: user.email ?? '',
        status: 'pending',
        requestedAt: new Date().toISOString(),
      }).catch(() => {})
    }

    const updateAccessState = () => {
      if (!requestLoaded || !playerLoaded) return

      const normalizedRequest = requestValue ? { id: user.uid, ...requestValue } : null
      setAccessRequest(normalizedRequest)
      setOwnPlayerExists(playerExists)

      if (isAdmin || requestValue?.status === 'approved' || (!requestValue && playerExists)) {
        setAccessStatus('approved')
      } else if (requestValue?.status === 'rejected') {
        setAccessStatus('rejected')
      } else {
        setAccessStatus('pending')
        if (!requestValue) {
          maybeCreatePendingRequest()
        }
      }

      setAccessReady(true)
    }

    const requestRef = ref(db, `accessRequests/${user.uid}`)
    const playerRef = ref(db, `players/${user.uid}`)

    const unsubscribeRequest = onValue(requestRef, snap => {
      requestValue = snap.val()
      requestLoaded = true
      updateAccessState()
    }, () => {
      requestValue = null
      requestLoaded = true
      updateAccessState()
    })

    const unsubscribePlayer = onValue(playerRef, snap => {
      playerExists = snap.exists()
      playerLoaded = true
      updateAccessState()
    }, () => {
      playerExists = false
      playerLoaded = true
      updateAccessState()
    })

    return () => {
      unsubscribeRequest()
      unsubscribePlayer()
    }
  }, [adminReady, isAdmin, user?.uid])

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !isAdmin) {
      setAccessRequests([])
      return
    }

    const accessRequestsRef = ref(db, 'accessRequests')
    const unsubscribe = onValue(accessRequestsRef, snap => {
      const next = objToArray(snap.val()).sort((left, right) => {
        const statusOrder = { pending: 0, approved: 1, rejected: 2 }
        return (
          (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99) ||
          String(left.requestedAt ?? '').localeCompare(String(right.requestedAt ?? ''))
        )
      })

      setAccessRequests(next)
    }, () => {
      setAccessRequests([])
    })

    return unsubscribe
  }, [isAdmin])

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user || !accessReady) return
    if (accessStatus !== 'approved' || ownPlayerExists) return

    const name =
      accessRequest?.name?.trim() ||
      user.displayName?.trim() ||
      user.email?.split('@')[0] ||
      'Participante'

    set(ref(db, `players/${user.uid}`), {
      name,
      email: user.email ?? accessRequest?.email ?? '',
      createdAt: accessRequest?.requestedAt ?? new Date().toISOString(),
    }).catch(() => {})
  }, [accessReady, accessRequest?.email, accessRequest?.name, accessRequest?.requestedAt, accessStatus, ownPlayerExists, user?.displayName, user?.email, user?.uid])

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
    let credentials = null
    try {
      credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password)

      await updateProfile(credentials.user, { displayName: trimmedName }).catch(() => {})

      await set(ref(db, `accessRequests/${credentials.user.uid}`), {
        name: trimmedName,
        email: normalizedEmail,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      })

      return {
        ok: true,
        message: 'Conta criada. Aguarde a aprovação do administrador.',
      }
    } catch (error) {
      if (credentials?.user) {
        await deleteUser(credentials.user).catch(() => {})
      }
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

  const reviewAccessRequest = useCallback(async (requestId, status) => {
    if (!db || !user || !isAdmin) {
      return { ok: false, error: 'Apenas administradores podem revisar cadastros.' }
    }

    const normalizedStatus = status === 'approved' ? 'approved' : 'rejected'

    try {
      const currentSnap = await get(ref(db, `accessRequests/${requestId}`))
      const currentValue = currentSnap.val()

      if (!currentValue) {
        return { ok: false, error: 'Solicitação não encontrada.' }
      }

      await set(ref(db, `accessRequests/${requestId}`), {
        ...currentValue,
        status: normalizedStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.uid,
      })

      if (normalizedStatus === 'rejected') {
        await remove(ref(db, `players/${requestId}`)).catch(() => {})
      }

      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.message ?? 'Não foi possível revisar o cadastro.' }
    }
  }, [isAdmin, user?.uid])

  const deleteRejectedAccessRequest = useCallback(async (requestId) => {
    if (!db || !user || !isAdmin) {
      return { ok: false, error: 'Apenas administradores podem excluir cadastros.' }
    }

    try {
      const currentSnap = await get(ref(db, `accessRequests/${requestId}`))
      const currentValue = currentSnap.val()

      if (!currentValue) {
        return { ok: false, error: 'Cadastro não encontrado.' }
      }

      if (currentValue.status !== 'rejected') {
        return { ok: false, error: 'Só é possível excluir cadastros rejeitados.' }
      }

      await remove(ref(db, `bets/${requestId}`)).catch(() => {})
      await remove(ref(db, `players/${requestId}`)).catch(() => {})
      await remove(ref(db, `accessRequests/${requestId}`))

      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.message ?? 'Não foi possível excluir o cadastro.' }
    }
  }, [isAdmin, user?.uid])

  return {
    user,
    authReady,
    pending,
    isAdmin,
    adminReady,
    accessRequest,
    accessRequests,
    accessStatus,
    accessReady,
    canAccessBolao: !isFirebaseConfigured || isAdmin || accessStatus === 'approved',
    signIn,
    signUp,
    resetPassword,
    signOut,
    reviewAccessRequest,
    deleteRejectedAccessRequest,
  }
}
