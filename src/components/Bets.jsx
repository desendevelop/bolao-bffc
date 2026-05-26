import { useMemo, useState } from 'react'
import { PHASE_CONFIG, getBetDeadline, isBettingOpen } from '../data/matches.js'
import { calcPoints } from '../utils/scoring.js'
import { Clock, Lock, ChevronDown, ChevronUp } from 'lucide-react'

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      className="score-input"
      min="0"
      max="99"
      maxLength={2}
      value={value}
      onChange={e => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 2)
        onChange(v === '' ? '' : Number(v))
      }}
      disabled={disabled}
    />
  )
}

function MatchBetRow({ match, player, bet, result, onSave }) {
  const open = isBettingOpen(match.date)
  const deadline = getBetDeadline(match.date)
  const matchDate = new Date(match.date)

  const [home, setHome] = useState(bet?.homeGoals ?? '')
  const [away, setAway] = useState(bet?.awayGoals ?? '')
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState('')

  const canBet = open && player
  const hasResult = !!result

  let points = null
  if (hasResult && bet) {
    points = calcPoints(bet, result, match.phase)
  }

  const handleChange = (setter) => (val) => {
    setter(val)
    setDirty(true)
    setSaveError('')
  }

  const handleSave = async () => {
    if (home === '' || away === '') return

    try {
      await onSave(match.id, Number(home), Number(away))
      setDirty(false)
      setSaveError('')
    } catch (error) {
      setSaveError(error?.message ?? 'Não foi possível salvar o palpite.')
    }
  }

  const formatDeadline = (d) =>
    d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  const formatMatchDate = (d) =>
    d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`match-row ${hasResult ? 'has-result' : ''} ${!open ? 'locked' : ''} ${points === 5 ? 'perfect' : ''}`}>
      <div className="match-info">
        <div className="match-teams">
          <span className="team home">{match.home}</span>
          <span className="vs">×</span>
          <span className="team away">{match.away}</span>
        </div>
        <div className="match-meta">
          <span className="match-date">{formatMatchDate(matchDate)}</span>
          <span className="match-venue">{match.venue}</span>
          {match.group && <span className="match-group">Grupo {match.group}</span>}
        </div>
      </div>

      <div className="match-bet-area">
        {player && (
          <>
            <div className="bet-input-row">
              <ScoreInput value={home} onChange={handleChange(setHome)} disabled={!canBet} />
              <span className="bet-sep">×</span>
              <ScoreInput value={away} onChange={handleChange(setAway)} disabled={!canBet} />
              {canBet && (
                <button
                  className={`btn btn-sm ${dirty ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={handleSave}
                  disabled={home === '' || away === ''}
                  title="Salvar palpite"
                >
                  {dirty ? 'Salvar' : (bet ? '✓' : '+')}
                </button>
              )}
              {!open && !bet && (
                <span className="lock-icon" title={`Prazo encerrado em ${formatDeadline(deadline)}`}>
                  <Lock size={14} />
                </span>
              )}
            </div>
            {!open && !bet && (
              <div className="bet-locked-message">
                <Lock size={12} />
                Já era, você DANILOU
              </div>
            )}
          </>
        )}

        {!player && (
          <span className="select-player-hint">Selecione um jogador</span>
        )}
      </div>

      <div className="match-result-area">
        {hasResult ? (
          <div className="result-display">
            <span className="result-score">{result.homeGoals} × {result.awayGoals}</span>
            {player && bet && (
              <span className={`points-badge pts-${points}`}>
                +{points}
              </span>
            )}
            {player && !bet && (
              <span className="points-badge pts-0">+0 <small>(SEM PALPITE)</small></span>
            )}
          </div>
        ) : (
          <span className="no-result">—</span>
        )}
      </div>

      {!open && !bet && (
        <div className="deadline-note error">
          <Clock size={12} />
          Já era, você DANILOU. Prazo encerrado em {formatDeadline(deadline)}
        </div>
      )}
      {saveError && (
        <div className="deadline-note error">
          <Lock size={12} />
          {saveError}
        </div>
      )}
    </div>
  )
}

export function Bets({ matches, currentPlayer, placeBet, getResult, getOwnBet }) {
  const [expandedPhases, setExpandedPhases] = useState({ group: true })

  const togglePhase = (phase) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }))
  }

  const groupedMatches = useMemo(() => {
    const groups = {}
    for (const m of matches) {
      if (!groups[m.phase]) groups[m.phase] = []
      groups[m.phase].push(m)
    }
    return groups
  }, [matches])

  return (
    <div className="bets-panel">
      <h2 className="section-title">Palpites</h2>

      <div className="bets-controls">
        {currentPlayer ? (
          <div className="player-card">
            <span className="control-label">Palpites de</span>
            <strong>{currentPlayer.name}</strong>
            <small>{currentPlayer.email}</small>
          </div>
        ) : (
          <p className="empty-text">
            Complete seu perfil na aba <strong>Perfil</strong> antes de começar a palpitar.
          </p>
        )}
      </div>

      <div className="matches-list">
        {Object.entries(PHASE_CONFIG).map(([phaseKey, phaseInfo]) => {
          const matches = groupedMatches[phaseKey] ?? []
          if (matches.length === 0) return null
          const expanded = expandedPhases[phaseKey] ?? false

          const withBet = currentPlayer
            ? matches.filter(match => getOwnBet(match.id)).length
            : 0

          return (
            <div key={phaseKey} className="phase-section">
              <button
                className="phase-toggle"
                onClick={() => togglePhase(phaseKey)}
              >
                <span className="phase-toggle-label">
                  {phaseInfo.label}
                  <span className="phase-mult-tag">{phaseInfo.multiplier}×</span>
                </span>
                <span className="phase-toggle-meta">
                  {currentPlayer && (
                    <span className="bet-progress">
                      {withBet}/{matches.length} palpites
                    </span>
                  )}
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {expanded && (
                <div className="phase-matches">
                  {matches.map(match => {
                    const bet = currentPlayer ? getOwnBet(match.id) : null
                    const result = getResult(match.id)
                    return (
                      <MatchBetRow
                        key={match.id}
                        match={match}
                        player={currentPlayer}
                        bet={bet}
                        result={result}
                        onSave={placeBet}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
