import { useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'

export function Players({ players, addPlayer, removePlayer }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Informe um nome'); return }
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Jogador já cadastrado'); return
    }
    addPlayer(trimmed)
    setName('')
    setError('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="players-panel">
      <h2 className="section-title">Jogadores</h2>

      <div className="add-player-row">
        <input
          className="input-field"
          placeholder="Nome do jogador"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          onKeyDown={handleKey}
          maxLength={40}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          <UserPlus size={16} />
          Adicionar
        </button>
      </div>
      {error && <p className="input-error">{error}</p>}

      <div className="player-list">
        {players.length === 0 ? (
          <p className="empty-text">Nenhum jogador ainda. Adicione o primeiro acima!</p>
        ) : (
          players.map((p, i) => (
            <div key={p.id} className="player-item">
              <span className="player-num">{i + 1}</span>
              <span className="player-name">{p.name}</span>
              <button
                className="btn btn-ghost btn-sm danger"
                onClick={() => {
                  if (confirm(`Remover ${p.name}? Todos os palpites serão perdidos.`)) {
                    removePlayer(p.id)
                  }
                }}
                title="Remover jogador"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
