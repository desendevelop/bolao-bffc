import { useState, useMemo } from 'react'
import { MATCHES, PHASE_CONFIG, getBetDeadline, isBettingOpen } from '../data/matches.js'
import { calcPoints, getWinner } from '../utils/scoring.js'
import { Clock, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

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

function MatchBetRow({ match, player, bet, result, onSave, isAdmin }) {
  const open = isBettingOpen(match.date)
  const deadline = getBetDeadline(match.date)
  const matchDate = new Date(match.date)

  const [home, setHome] = useState(bet?.homeGoals ?? '')
  const [away, setAway] = useState(bet?.awayGoals ?? '')
  const [dirty, setDirty] = useState(false)

  const canBet = open && player
  const hasResult = !!result

  let points = null
  if (hasResult && bet) {
    points = calcPoints(bet, result, match.phase)
  }

  const handleChange = (setter) => (val) => {
    setter(val)
    setDirty(true)
  }

  const handleSave = () => {
    if (home === '' || away === '') return
    onSave(match.id, Number(home), Number(away))
    setDirty(false)
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
            {!open && !hasResult && (
              <span className="lock-icon" title={`Prazo encerrado em ${formatDeadline(deadline)}`}>
                <Lock size={14} />
              </span>
            )}
          </div>
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
              <span className="points-badge pts-0">+0 <small>(sem palpite)</small></span>
            )}
          </div>
        ) : (
          <span className="no-result">—</span>
        )}
      </div>

      {!open && !hasResult && (
        <div className="deadline-note">
          <Clock size={12} />
          Prazo: {formatDeadline(deadline)}
        </div>
      )}
    </div>
  )
}

export function Bets({ players, bets, results, placeBet, getResult, getBet }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [expandedPhases, setExpandedPhases] = useState({ group: true })

  const resultMap = useMemo(
    () => Object.fromEntries(results.map(r => [r.matchId, r])),
    [results]
  )

  const togglePhase = (phase) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }))
  }

  const groupedMatches = useMemo(() => {
    const groups = {}
    for (const m of MATCHES) {
      if (!groups[m.phase]) groups[m.phase] = []
      groups[m.phase].push(m)
    }
    return groups
  }, [])

  return (
    <div className="bets-panel">
      <h2 className="section-title">Palpites</h2>

      <div className="bets-controls">
        <div className="control-group">
          <label className="control-label">Jogador</label>
          <select
            className="select-field"
            value={selectedPlayer?.id ?? ''}
            onChange={e => {
              const p = players.find(p => p.id === e.target.value)
              setSelectedPlayer(p ?? null)
            }}
          >
            <option value="">Selecione um jogador</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="matches-list">
        {Object.entries(PHASE_CONFIG).map(([phaseKey, phaseInfo]) => {
          const matches = groupedMatches[phaseKey] ?? []
          if (matches.length === 0) return null
          const expanded = expandedPhases[phaseKey] ?? false

          const closedCount = matches.filter(m => !isBettingOpen(m.date)).length
          const withBet = selectedPlayer
            ? matches.filter(m => (bets[selectedPlayer.id] ?? []).some(b => b.matchId === m.id)).length
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
                  {selectedPlayer && (
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
                    const bet    = selectedPlayer ? getBet(selectedPlayer.id, match.id) : null
                    const result = getResult(match.id)
                    return (
                      <MatchBetRow
                        key={match.id}
                        match={match}
                        player={selectedPlayer}
                        bet={bet}
                        result={result}
                        onSave={(matchId, h, a) => placeBet(selectedPlayer.id, matchId, h, a)}
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
