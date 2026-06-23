import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Lock } from 'lucide-react'
import { isBettingOpen, sortMatchesByDate } from '../data/matches.js'
import { PastMatchesGroup } from './PastMatchesGroup.jsx'
import { LiveMatchSection, useLiveMatchIds } from './LiveMatchSection.jsx'
import { calcPoints } from '../utils/scoring.js'

function getDayKey(matchDate) {
  return matchDate.slice(0, 10)
}

function formatDayLabel(dayKey) {
  return new Date(`${dayKey}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatMatchHour(matchDate) {
  return new Date(matchDate).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DayMatchCard({ match, entries, result, currentPlayerId, isLive = false }) {
  const open = isBettingOpen(match.date)
  const submittedCount = entries.filter(entry => !!entry.bet).length
  const orderedEntries = [...entries].sort((left, right) => {
    if (left.player.id === currentPlayerId) return -1
    if (right.player.id === currentPlayerId) return 1
    return left.player.name.localeCompare(right.player.name, 'pt-BR')
  })

  return (
    <div className={`day-match-card ${open ? 'hidden' : 'revealed'} ${isLive ? 'live' : ''}`}>
      <div className="day-match-header">
        <div>
          <strong>{match.home} × {match.away}</strong>
          <div className="day-match-meta">
            <span>{formatMatchHour(match.date)}</span>
            <span>{match.venue}</span>
            {match.group && <span>Grupo {match.group}</span>}
          </div>
        </div>

        <div className="day-match-status">
          {open ? (
            <>
              <Lock size={13} />
              Ainda oculto
            </>
          ) : (
            <span>{submittedCount}/{entries.length} palpitaram</span>
          )}
        </div>
      </div>

      {open ? (
        <div className="day-match-hidden">
          Os palpites desse jogo so aparecem para todos depois que a trava for ativada.
        </div>
      ) : (
        <div className="day-match-bets">
          {orderedEntries.map(({ player, bet }) => {
            const points = result && bet ? calcPoints(bet, result, match.phase) : null
            const isCurrentPlayer = player.id === currentPlayerId

            return (
              <div key={`${match.id}-${player.id}`} className={`day-match-bet-row ${isCurrentPlayer ? 'current' : ''}`}>
                <div className="day-match-bet-player">
                  <strong>{player.name}</strong>
                  <span>{isCurrentPlayer ? 'Você' : (player.email ?? 'Participante')}</span>
                </div>

                <div className="day-match-bet-values">
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
          })}
        </div>
      )}
    </div>
  )
}

export function DayBets({ matches, currentPlayer, getResult, getVisibleBets }) {
  const dayOptions = useMemo(() => {
    const uniqueDayKeys = [...new Set(matches.map(match => getDayKey(match.date)))].sort()
    return uniqueDayKeys.map(dayKey => ({
      value: dayKey,
      label: formatDayLabel(dayKey),
    }))
  }, [matches])

  const [selectedDay, setSelectedDay] = useState('')

  useEffect(() => {
    if (dayOptions.length === 0) {
      setSelectedDay('')
      return
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    const defaultDay = dayOptions.find(option => option.value === todayKey)?.value ?? dayOptions[0].value

    setSelectedDay(current => (
      dayOptions.some(option => option.value === current) ? current : defaultDay
    ))
  }, [dayOptions])

  const dayMatches = useMemo(
    () => sortMatchesByDate(matches.filter(match => getDayKey(match.date) === selectedDay)),
    [matches, selectedDay],
  )

  const lockedCount = dayMatches.filter(match => !isBettingOpen(match.date)).length
  const liveMatchIds = useLiveMatchIds(dayMatches)

  const renderDayMatchCard = (match, isLive = false) => (
    <DayMatchCard
      key={match.id}
      match={match}
      entries={getVisibleBets ? getVisibleBets(match.id) : []}
      result={getResult(match.id)}
      currentPlayerId={currentPlayer?.id ?? null}
      isLive={isLive}
    />
  )

  return (
    <div className="day-bets">
      <h2 className="section-title">Palpites do dia</h2>

      <div className="day-bets-controls">
        <div className="control-group">
          <label className="control-label">Dia do calendario</label>
          <select
            className="select-field"
            value={selectedDay}
            onChange={event => setSelectedDay(event.target.value)}
          >
            {dayOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="day-bets-summary">
          <span className="evolution-pill">
            <CalendarDays size={13} />
            {dayMatches.length} jogo{dayMatches.length !== 1 ? 's' : ''}
          </span>
          <span className="evolution-pill">
            <Lock size={13} />
            {lockedCount} revelado{lockedCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <LiveMatchSection
        matches={dayMatches}
        renderMatch={match => renderDayMatchCard(match, true)}
      />

      <div className="day-bets-list">
        <PastMatchesGroup
          matches={dayMatches}
          excludeIds={liveMatchIds}
          renderMatch={match => renderDayMatchCard(match)}
        />
      </div>
    </div>
  )
}
