import { useEffect, useMemo, useState } from 'react'
import { PHASE_CONFIG } from '../data/matches.js'
import { Shield, Save, Trash2, Lock, Wand2 } from 'lucide-react'

function ResultInput({ match, currentResult, currentOverride, onSave, onRemove, onSaveOverride, onClearOverride }) {
  const [home, setHome] = useState(currentResult?.homeGoals ?? '')
  const [away, setAway] = useState(currentResult?.awayGoals ?? '')
  const [winnerSide, setWinnerSide] = useState(currentResult?.winnerSide ?? '')
  const [overrideHome, setOverrideHome] = useState(currentOverride?.home ?? match.home)
  const [overrideAway, setOverrideAway] = useState(currentOverride?.away ?? match.away)
  const [overrideFeedback, setOverrideFeedback] = useState('')
  const isKnockout = match.phase !== 'group'
  const isDraw = home !== '' && away !== '' && Number(home) === Number(away)

  useEffect(() => {
    setHome(currentResult?.homeGoals ?? '')
    setAway(currentResult?.awayGoals ?? '')
    setWinnerSide(currentResult?.winnerSide ?? '')
  }, [currentResult?.matchId, currentResult?.homeGoals, currentResult?.awayGoals, currentResult?.winnerSide])

  useEffect(() => {
    setOverrideHome(currentOverride?.home ?? match.home)
    setOverrideAway(currentOverride?.away ?? match.away)
    setOverrideFeedback('')
  }, [currentOverride?.home, currentOverride?.away, match.home, match.away])

  const handleSave = () => {
    if (home === '' || away === '') return
    if (isKnockout && isDraw && !winnerSide) return
    onSave(match.id, Number(home), Number(away), isKnockout && isDraw ? winnerSide : null)
  }

  const handleSaveOverride = async () => {
    try {
      await onSaveOverride(match.id, overrideHome, overrideAway)
      setOverrideFeedback('Ajuste manual salvo.')
    } catch (error) {
      setOverrideFeedback(error?.message ?? 'Não foi possível salvar o ajuste.')
    }
  }

  const handleClearOverride = async () => {
    await onClearOverride(match.id)
    setOverrideFeedback('Ajuste manual removido.')
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
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={home === '' || away === '' || (isKnockout && isDraw && !winnerSide)}
        >
          <Save size={13} /> Salvar
        </button>
        {currentResult && (
          <button className="btn btn-sm btn-ghost danger" onClick={() => onRemove(match.id)} title="Remover resultado">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {isKnockout && isDraw && (
        <div className="winner-toggle-row">
          <span className="control-label">Quem avançou?</span>
          <button
            type="button"
            className={`btn btn-sm ${winnerSide === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWinnerSide('home')}
          >
            {match.home}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${winnerSide === 'away' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWinnerSide('away')}
          >
            {match.away}
          </button>
        </div>
      )}
      {isKnockout && (
        <div className="override-card">
          <div className="override-card-header">
            <span className="control-label">Fallback manual do confronto</span>
            {currentOverride && <span className="override-badge">Override ativo</span>}
          </div>
          <div className="override-row">
            <input
              className="input-field"
              value={overrideHome}
              onChange={event => {
                setOverrideHome(event.target.value)
                setOverrideFeedback('')
              }}
              placeholder="Time mandante"
            />
            <span>×</span>
            <input
              className="input-field"
              value={overrideAway}
              onChange={event => {
                setOverrideAway(event.target.value)
                setOverrideFeedback('')
              }}
              placeholder="Time visitante"
            />
          </div>
          <div className="override-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={handleSaveOverride}>
              <Wand2 size={13} />
              Salvar times
            </button>
            {currentOverride && (
              <button type="button" className="btn btn-sm btn-ghost danger" onClick={handleClearOverride}>
                <Trash2 size={13} />
                Limpar ajuste
              </button>
            )}
          </div>
          {overrideFeedback && <span className="override-feedback">{overrideFeedback}</span>}
        </div>
      )}
      {currentResult && (
        <span className="result-confirmed">✓ {currentResult.homeGoals} × {currentResult.awayGoals}</span>
      )}
    </div>
  )
}

export function Admin({ currentUser, canManageResults, adminReady, matches, matchOverrides, results, setResult, removeResult, saveMatchOverride, clearMatchOverride }) {
  const [phaseFilter, setPhaseFilter] = useState('group')

  const resultMap = useMemo(
    () => Object.fromEntries(results.map(r => [r.matchId, r])),
    [results]
  )

  const filteredMatches = matches.filter(m => m.phase === phaseFilter)

  if (!adminReady) {
    return (
      <div className="admin-lock">
        <Shield size={40} />
        <h2>Área do Administrador</h2>
        <p>Verificando permissões da sua conta…</p>
      </div>
    )
  }

  if (!canManageResults) {
    return (
      <div className="admin-lock">
        <Lock size={40} />
        <h2>Acesso restrito</h2>
        <p>
          Esta conta não está marcada como administradora no Firebase.
          Use a conta admin ou adicione o seu UID em <code>/admins/{currentUser?.uid}</code> com valor <code>true</code>.
        </p>
        <small>{currentUser?.email}</small>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <Shield size={20} />
        <h2 className="section-title">Painel de Resultados</h2>
        <span className="admin-badge">Conta autorizada</span>
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
              currentOverride={matchOverrides?.[match.id] ?? null}
              onSave={setResult}
              onRemove={removeResult}
              onSaveOverride={saveMatchOverride}
              onClearOverride={clearMatchOverride}
            />
          ))
        )}
      </div>
    </div>
  )
}
