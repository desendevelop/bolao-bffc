import { useEffect, useState } from 'react'
import { Save, UserCircle2 } from 'lucide-react'

export function Players({ currentUser, currentPlayer, players, saveOwnProfile }) {
  const [name, setName] = useState(currentPlayer?.name ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setName(currentPlayer?.name ?? '')
    setError('')
  }, [currentPlayer?.id, currentPlayer?.name])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Informe um nome'); return }
    if (players.some(p => p.id !== currentPlayer?.id && p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Jogador já cadastrado'); return
    }

    try {
      const result = await saveOwnProfile(trimmed)
      if (result?.ok === false) {
        setError(result.error ?? 'Não foi possível adicionar o jogador')
        return
      }

      setError('')
      setSuccess(currentPlayer ? 'Perfil atualizado com sucesso.' : 'Perfil criado com sucesso.')
    } catch (err) {
      setError(err?.message ?? 'Não foi possível salvar seu perfil')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="players-panel">
      <h2 className="section-title">Seu perfil</h2>

      <div className="profile-card">
        <div className="profile-card-header">
          <UserCircle2 size={22} />
          <div>
            <strong>{currentPlayer?.name ?? 'Perfil ainda não criado'}</strong>
            <span>{currentUser?.email}</span>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Nome que aparece no ranking</label>
          <div className="add-player-row">
            <input
              className="input-field"
              placeholder="Nome do participante"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError('')
                setSuccess('')
              }}
              onKeyDown={handleKey}
              maxLength={40}
            />
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>

        <div className="profile-meta">
          <span><strong>E-mail:</strong> {currentUser?.email}</span>
          {currentPlayer?.createdAt && (
            <span>
              <strong>Criado em:</strong>{' '}
              {new Date(currentPlayer.createdAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {error && <p className="input-error">{error}</p>}
      {success && <p className="input-success">{success}</p>}

      <div className="player-list">
        {players.length === 0 ? (
          <p className="empty-text">Nenhum participante cadastrado ainda.</p>
        ) : (
          players.map((p, i) => (
            <div key={p.id} className="player-item">
              <span className="player-num">{i + 1}</span>
              <span className="player-name">{p.name}</span>
              <span className="player-email">{p.email ?? 'Participante legado'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
