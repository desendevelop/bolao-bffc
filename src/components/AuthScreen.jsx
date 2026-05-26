import { useState } from 'react'
import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-react'

export function AuthScreen({ onSignIn, onSignUp, onResetPassword, pending }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    clearMessages()

    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }

    if (mode === 'reset') {
      const result = await onResetPassword(email)
      if (!result?.ok) {
        setError(result?.error ?? 'Não foi possível enviar o link de recuperação.')
        return
      }

      setSuccess(result.message ?? 'Confira seu e-mail para redefinir a senha.')
      return
    }

    if (!password) {
      setError('Informe sua senha.')
      return
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setError('Informe seu nome como ele deve aparecer no bolão.')
        return
      }

      if (password.length < 6) {
        setError('A senha precisa ter pelo menos 6 caracteres.')
        return
      }

      if (password !== confirmPassword) {
        setError('As senhas não conferem.')
        return
      }

      const result = await onSignUp({
        name,
        email,
        password,
      })

      if (!result?.ok) {
        setError(result?.error ?? 'Não foi possível criar a conta.')
      }

      return
    }

    const result = await onSignIn({ email, password })
    if (!result?.ok) {
      setError(result?.error ?? 'Não foi possível entrar.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Bolão</span>
          <h1>{mode === 'reset' ? 'Recupere seu acesso' : 'Acesse seu bolão'}</h1>
          <p>
            {mode === 'reset'
              ? 'Informe o e-mail da conta e o Firebase enviará um link para redefinir a senha.'
              : 'Cada participante usa seu próprio e-mail e senha para editar apenas os próprios palpites.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' || mode === 'reset' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              clearMessages()
            }}
            type="button"
          >
            <LogIn size={15} />
            Entrar
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup')
              clearMessages()
            }}
            type="button"
          >
            <UserPlus size={15} />
            Criar conta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="control-group">
              <span className="control-label">Nome no bolão</span>
              <input
                className="input-field"
                value={name}
                onChange={event => {
                  setName(event.target.value)
                  clearMessages()
                }}
                placeholder="Ex.: Felipe"
                maxLength={40}
              />
            </label>
          )}

          <label className="control-group">
            <span className="control-label">E-mail</span>
            <div className="input-with-icon">
              <Mail size={15} />
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={event => {
                  setEmail(event.target.value)
                  clearMessages()
                }}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </div>
          </label>

          {mode !== 'reset' && (
            <label className="control-group">
              <span className="control-label">Senha</span>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={event => {
                  setPassword(event.target.value)
                  clearMessages()
                }}
                placeholder="Mínimo de 6 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          )}

          {mode === 'signup' && (
            <label className="control-group">
              <span className="control-label">Confirmar senha</span>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={event => {
                  setConfirmPassword(event.target.value)
                  clearMessages()
                }}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </label>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setMode('reset')
                clearMessages()
              }}
            >
              <KeyRound size={14} />
              Esqueci minha senha
            </button>
          )}

          {error && <p className="input-error">{error}</p>}
          {success && <p className="input-success">{success}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={pending}>
            {pending
              ? 'Processando…'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'reset'
                  ? 'Enviar link de recuperação'
                  : 'Criar conta'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              className="btn btn-ghost auth-submit"
              onClick={() => {
                setMode('login')
                clearMessages()
              }}
            >
              Voltar ao login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
