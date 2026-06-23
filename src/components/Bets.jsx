import { useEffect, useMemo, useRef, useState } from 'react'
import { PHASE_CONFIG, getBetDeadline, isBettingOpen, sortMatchesByDate } from '../data/matches.js'
import { PastMatchesGroup } from './PastMatchesGroup.jsx'
import { LiveMatchSection, useLiveMatchIds } from './LiveMatchSection.jsx'
import { calcPoints } from '../utils/scoring.js'
import { Clock, Lock, ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-react'

function stepScoreValue(value, delta) {
  const current = value === '' ? 0 : Number(value)
  const next = Math.max(0, Math.min(99, current + delta))
  return next
}

function ScoreInput({ value, onChange, disabled }) {
  return (
    <div className="score-stepper">
      <button
        type="button"
        className="score-step-btn"
        onClick={() => onChange(stepScoreValue(value, -1))}
        disabled={disabled || value === '' || Number(value) <= 0}
        aria-label="Diminuir gols"
      >
        <Minus size={14} />
      </button>
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
      <button
        type="button"
        className="score-step-btn"
        onClick={() => onChange(stepScoreValue(value, 1))}
        disabled={disabled || value !== '' && Number(value) >= 99}
        aria-label="Aumentar gols"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

function formatDeadline(d) {
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatMatchDate(d) {
  return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function SelectedRevealedBet({ match, entry, result, currentPlayerId }) {
  if (!entry) return null

  const { player, bet } = entry
  const points = result && bet ? calcPoints(bet, result, match.phase) : null
  const isCurrentPlayer = player.id === currentPlayerId

  return (
    <div className={`revealed-selection ${isCurrentPlayer ? 'current' : ''}`}>
      <div className="revealed-selection-header">
        <strong>{player.name}</strong>
        <span>{isCurrentPlayer ? 'Você' : (player.email ?? 'Participante')}</span>
      </div>

      <div className="revealed-selection-body">
        {bet ? (
          <span className="revealed-score">{bet.homeGoals} × {bet.awayGoals}</span>
        ) : (
          <span className="revealed-missing">Sem palpite</span>
        )}

        {result && (
          bet ? (
            <span className={`points-badge pts-${points}`}>+{points}</span>
          ) : (
            <span className="points-badge pts-0">+0</span>
          )
        )}
      </div>
    </div>
  )
}

function MatchBetRow({ match, player, bet, result, selectedVisibleEntry, onSave, onRemove, isLive = false }) {
  const open = isBettingOpen(match.date)
  const deadline = getBetDeadline(match.date)
  const matchDate = new Date(match.date)

  const [home, setHome] = useState(bet?.homeGoals ?? '')
  const [away, setAway] = useState(bet?.awayGoals ?? '')
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState('')

  const canBet = open && player
  const hasResult = !!result

  useEffect(() => {
    setHome(bet?.homeGoals ?? '')
    setAway(bet?.awayGoals ?? '')
    setDirty(false)
    setSaveError('')
  }, [bet?.homeGoals, bet?.awayGoals, bet?.matchId])

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

  const handleClear = async () => {
    if (!canBet) return

    try {
      if (bet) {
        await onRemove(match.id)
      }

      setHome('')
      setAway('')
      setDirty(false)
      setSaveError('')
    } catch (error) {
      setSaveError(error?.message ?? 'Não foi possível apagar o palpite.')
    }
  }

  return (
    <div className={`match-row ${hasResult ? 'has-result' : ''} ${!open ? 'locked' : ''} ${points === 5 ? 'perfect' : ''} ${isLive ? 'live' : ''}`}>
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
                <>
                  <button
                    className={`btn btn-sm ${dirty ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={handleSave}
                    disabled={home === '' || away === ''}
                    title="Salvar palpite"
                  >
                    {dirty ? 'Salvar' : (bet ? '✓' : '+')}
                  </button>
                  {(bet || home !== '' || away !== '') && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost danger"
                      onClick={handleClear}
                      title="Apagar palpite"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
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
      {!open && selectedVisibleEntry && (
        <SelectedRevealedBet
          match={match}
          entry={selectedVisibleEntry}
          result={result}
          currentPlayerId={player?.id ?? null}
        />
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

export function Bets({ matches, players, currentPlayer, placeBet, removeBet, getResult, getOwnBet, getVisibleBets }) {
  const [expandedPhases, setExpandedPhases] = useState({ group: true })
  const [selectedRevealPlayerId, setSelectedRevealPlayerId] = useState('')
  const userPickedRevealPlayer = useRef(false)

  useEffect(() => {
    userPickedRevealPlayer.current = false
  }, [currentPlayer?.id])

  useEffect(() => {
    if (players.length === 0) {
      setSelectedRevealPlayerId('')
      return
    }

    const availableIds = new Set(players.map(player => player.id))

    setSelectedRevealPlayerId(prev => {
      if (userPickedRevealPlayer.current && prev && availableIds.has(prev)) {
        return prev
      }

      if (currentPlayer?.id && availableIds.has(currentPlayer.id)) {
        return currentPlayer.id
      }

      if (prev && availableIds.has(prev)) {
        return prev
      }

      return players[0]?.id ?? ''
    })
  }, [players, currentPlayer?.id])

  const togglePhase = (phase) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }))
  }

  const groupedMatches = useMemo(() => {
    const groups = {}
    for (const m of matches) {
      if (!groups[m.phase]) groups[m.phase] = []
      groups[m.phase].push(m)
    }
    for (const phase of Object.keys(groups)) {
      groups[phase] = sortMatchesByDate(groups[phase])
    }
    return groups
  }, [matches])

  const liveMatchIds = useLiveMatchIds(matches)

  const renderMatchBetRow = (match, isLive = false) => {
    const bet = currentPlayer ? getOwnBet(match.id) : null
    const result = getResult(match.id)
    const selectedVisibleEntry = selectedRevealPlayerId && getVisibleBets
      ? getVisibleBets(match.id).find(entry => entry.player.id === selectedRevealPlayerId) ?? null
      : null

    return (
      <MatchBetRow
        key={match.id}
        match={match}
        player={currentPlayer}
        bet={bet}
        result={result}
        selectedVisibleEntry={selectedVisibleEntry}
        onSave={placeBet}
        onRemove={removeBet}
        isLive={isLive}
      />
    )
  }

  return (
    <div className="bets-panel">
      <h2 className="section-title">Palpites</h2>

      <div className="bets-controls">
        {currentPlayer ? (
          <>
            <div className="player-card">
              <span className="control-label">Seus palpites</span>
              <strong>{currentPlayer.name}</strong>
              <small>{currentPlayer.email}</small>
            </div>

            {players.length > 0 && (
              <div className="control-group">
                <label className="control-label">Ver palpite revelado de</label>
                <select
                  className="select-field"
                  value={selectedRevealPlayerId}
                  onChange={event => {
                    userPickedRevealPlayer.current = true
                    setSelectedRevealPlayerId(event.target.value)
                  }}
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}{player.id === currentPlayer.id ? ' (você)' : ''}
                    </option>
                  ))}
                </select>
                <small className="control-help">Esse palpite só aparece depois que a trava do jogo fecha.</small>
              </div>
            )}
          </>
        ) : (
          <p className="empty-text">
            Complete seu perfil na aba <strong>Perfil</strong> antes de começar a palpitar.
          </p>
        )}
      </div>

      <LiveMatchSection
        matches={matches}
        renderMatch={match => renderMatchBetRow(match, true)}
      />

      <div className="matches-list">
        {Object.entries(PHASE_CONFIG).map(([phaseKey, phaseInfo]) => {
          const phaseMatches = (groupedMatches[phaseKey] ?? []).filter(match => !liveMatchIds.has(match.id))
          if (phaseMatches.length === 0) return null
          const expanded = expandedPhases[phaseKey] ?? false

          const withBet = currentPlayer
            ? phaseMatches.filter(match => getOwnBet(match.id)).length
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
                      {withBet}/{phaseMatches.length} palpites
                    </span>
                  )}
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {expanded && (
                <div className="phase-matches">
                  <PastMatchesGroup
                    matches={phaseMatches}
                    excludeIds={liveMatchIds}
                    renderMatch={match => renderMatchBetRow(match)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
