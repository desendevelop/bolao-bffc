import { useState, useMemo } from 'react'
import { MATCHES, PHASE_CONFIG, isBettingOpen } from '../data/matches.js'
import { Shield, Save, Trash2 } from 'lucide-react'

function ResultInput({ match, currentResult, onSave, onRemove }) {
  const [home, setHome] = useState(currentResult?.homeGoals ?? '')
  const [away, setAway] = useState(currentResult?.awayGoals ?? '')

  const handleSave = () => {
    if (home === '' || away === '') return
    onSave(match.id, Number(home), Number(away))
  }

  return (
    <div className={`result-row ${currentResult ? 'has-result' : ''}`}>
      <div className="result-match-info">
        <span className="match-id-badge">{match.id}</span>
        <span className="teams-label">{match.home} × {match.away}</span>
        <span className="venue-label">{match.venue}</span>
      </div>
      <div className="result-inputs">
        <input
          type="number"
          className="score-input"
          min="0" max="99"
          value={home}
          onChange={e => setHome(e.target.value.replace(/\D/g,'').slice(0,2) === '' ? '' : Number(e.target.value.replace(/\D/g,'').slice(0,2)))}
          placeholder="0"
        />
        <span>×</span>
        <input
          type="number"
          className="score-input"
          min="0" max="99"
          value={away}
          onChange={e => setAway(e.target.value.replace(/\D/g,'').slice(0,2) === '' ? '' : Number(e.target.value.replace(/\D/g,'').slice(0,2)))}
          placeholder="0"
        />
        <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={home === '' || away === ''}>
          <Save size={13} /> Salvar
        </button>
        {currentResult && (
          <button className="btn btn-sm btn-ghost danger" onClick={() => onRemove(match.id)} title="Remover resultado">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {currentResult && (
        <span className="result-confirmed">✓ {currentResult.homeGoals} × {currentResult.awayGoals}</span>
      )}
    </div>
  )
}

export function Admin({ results, setResult, removeResult }) {
  const [phaseFilter, setPhaseFilter] = useState('group')
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  // PIN simples para não deixar qualquer um mexer nos resultados.
  // Padrão: "copa2026" — altere conforme sua necessidade.
  const ADMIN_PIN = 'copa2026'

  const resultMap = useMemo(
    () => Object.fromEntries(results.map(r => [r.matchId, r])),
    [results]
  )

  const filteredMatches = MATCHES.filter(m => m.phase === phaseFilter)

  if (!unlocked) {
    return (
      <div className="admin-lock">
        <Shield size={40} />
        <h2>Área do Administrador</h2>
        <p>Insira o PIN para acessar o painel de resultados.</p>
        <div className="pin-row">
          <input
            type="password"
            className="input-field"
            placeholder="PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (pin === ADMIN_PIN) setUnlocked(true)
                else alert('PIN incorreto')
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              if (pin === ADMIN_PIN) setUnlocked(true)
              else alert('PIN incorreto')
            }}
          >
            Entrar
          </button>
        </div>
        <small>PIN padrão: <code>copa2026</code> — altere em <code>src/components/Admin.jsx</code></small>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <Shield size={20} />
        <h2 className="section-title">Painel de Resultados</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setUnlocked(false)}>Sair</button>
      </div>

      <div className="phase-tabs">
        {Object.entries(PHASE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`phase-tab ${phaseFilter === key ? 'active' : ''}`}
            onClick={() => setPhaseFilter(key)}
          >
            {cfg.label}
            <span className="tab-mult">{cfg.multiplier}×</span>
          </button>
        ))}
      </div>

      <div className="results-list">
        {filteredMatches.length === 0 ? (
          <p className="empty-text">Nenhum jogo nesta fase.</p>
        ) : (
          filteredMatches.map(match => (
            <ResultInput
              key={match.id}
              match={match}
              currentResult={resultMap[match.id] ?? null}
              onSave={setResult}
              onRemove={removeResult}
            />
          ))
        )}
      </div>
    </div>
  )
}
