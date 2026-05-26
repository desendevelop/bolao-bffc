import { useEffect, useMemo, useRef, useState } from 'react'
import { PHASE_CONFIG } from '../data/matches.js'
import { calcRankingHistory } from '../utils/scoring.js'

const PLAYER_COLORS = [
  '#00e5ff',
  '#f5c518',
  '#ff6b6b',
  '#7c4dff',
  '#66bb6a',
  '#ff8a65',
  '#29b6f6',
  '#ab47bc',
  '#26a69a',
  '#ffa726',
  '#ec407a',
  '#9ccc65',
]

function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

function formatMatchMoment(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildSeries(players, history) {
  if (history.length === 0) return []

  const latestRanking = history[history.length - 1]?.ranking ?? []
  const latestByPlayerId = Object.fromEntries(latestRanking.map(entry => [entry.id, entry]))

  return players
    .map((player, index) => {
      const color = getPlayerColor(index)
      const points = history.map((snapshot, snapshotIndex) => {
        const rankingEntry = snapshot.ranking.find(entry => entry.id === player.id)

        return {
          step: snapshotIndex + 1,
          matchId: snapshot.matchId,
          phase: snapshot.phase,
          date: snapshot.date,
          position: rankingEntry?.position ?? players.length,
          total: rankingEntry?.total ?? 0,
        }
      })

      const latest = latestByPlayerId[player.id]

      return {
        playerId: player.id,
        name: player.name,
        color,
        points,
        latestPosition: latest?.position ?? players.length,
        latestTotal: latest?.total ?? 0,
      }
    })
    .sort((left, right) => (
      left.latestPosition - right.latestPosition ||
      right.latestTotal - left.latestTotal ||
      left.name.localeCompare(right.name, 'pt-BR')
    ))
}

function buildPath(points, xForStep, yForValue, metric) {
  return points
    .map((point, index) => {
      const value = metric === 'position' ? point.position : point.total
      return `${index === 0 ? 'M' : 'L'} ${xForStep(point.step)} ${yForValue(value)}`
    })
    .join(' ')
}

function buildPointTicks(maxTotal) {
  const safeMax = Math.max(1, maxTotal)
  const rawTicks = Array.from({ length: 5 }, (_, index) => (
    Math.round((safeMax * index) / 4)
  ))

  return [...new Set(rawTicks)].sort((left, right) => left - right)
}

export function Evolution({ players, bets, results, matches }) {
  const chartAreaRef = useRef(null)
  const [metric, setMetric] = useState('position')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [tooltip, setTooltip] = useState(null)

  const history = useMemo(
    () => calcRankingHistory(players, bets, results, matches),
    [players, bets, results, matches],
  )

  const series = useMemo(
    () => buildSeries(players, history),
    [players, history],
  )

  useEffect(() => {
    const availableIds = series.map(player => player.playerId)

    setSelectedPlayerIds(current => {
      const next = current.filter(id => availableIds.includes(id))
      return next.length > 0 ? next : availableIds
    })
  }, [series])

  if (players.length === 0) {
    return (
      <div className="empty-state">
        <span>Nenhum jogador cadastrado ainda.</span>
        <span>Quando houver participantes, o gráfico de evolução aparecerá aqui.</span>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="evolution">
        <h2 className="section-title">Evolução do ranking</h2>
        <div className="empty-state">
          <span>Ainda não existe evolução para mostrar.</span>
          <span>O gráfico começa a aparecer assim que o admin lançar o primeiro resultado.</span>
        </div>
      </div>
    )
  }

  const visibleSeries = series.filter(player => selectedPlayerIds.includes(player.playerId))
  const chartWidth = Math.max(680, history.length * 32)
  const chartHeight = metric === 'position'
    ? Math.max(260, players.length * 52)
    : 320
  const margin = { top: 24, right: 24, bottom: 52, left: 46 }
  const innerWidth = chartWidth - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom
  const latestSnapshot = history[history.length - 1]
  const tickEvery = Math.max(1, Math.ceil(history.length / 8))
  const maxTotal = Math.max(...series.flatMap(player => player.points.map(point => point.total)), 0)
  const pointTicks = buildPointTicks(maxTotal)

  const xForStep = step => {
    if (history.length === 1) return margin.left + innerWidth / 2
    return margin.left + ((step - 1) / (history.length - 1)) * innerWidth
  }

  const yForValue = value => {
    if (metric === 'position') {
      if (players.length === 1) return margin.top + innerHeight / 2
      return margin.top + ((value - 1) / (players.length - 1)) * innerHeight
    }

    if (maxTotal <= 0) return margin.top + innerHeight
    return margin.top + innerHeight - (value / maxTotal) * innerHeight
  }

  const showAllPlayers = () => setSelectedPlayerIds(series.map(player => player.playerId))
  const showTopPlayers = () => setSelectedPlayerIds(series.slice(0, 5).map(player => player.playerId))
  const clearPlayers = () => setSelectedPlayerIds([])

  const togglePlayer = playerId => {
    setSelectedPlayerIds(current => (
      current.includes(playerId)
        ? current.filter(id => id !== playerId)
        : [...current, playerId]
    ))
  }

  const updateTooltip = (event, player, point) => {
    const chartArea = chartAreaRef.current
    if (!chartArea) return

    const areaRect = chartArea.getBoundingClientRect()
    const pointRect = event.currentTarget.getBoundingClientRect()
    const rawLeft = pointRect.left - areaRect.left + (pointRect.width / 2)
    const minLeft = Math.min(96, Math.max(48, areaRect.width / 2))
    const maxLeft = Math.max(minLeft, areaRect.width - minLeft)

    setTooltip({
      left: Math.min(Math.max(rawLeft, minLeft), maxLeft),
      top: pointRect.top - areaRect.top - 10,
      player,
      point,
    })
  }

  return (
    <div className="evolution">
      <h2 className="section-title">Evolução do ranking</h2>

      <div className="evolution-summary">
        <span className="evolution-pill">{history.length} resultados no gráfico</span>
        <span className="evolution-pill">Cada ponto representa 1 jogo com resultado lançado</span>
        <span className="evolution-pill">{selectedPlayerIds.length} jogador{selectedPlayerIds.length !== 1 ? 'es' : ''} visível{selectedPlayerIds.length !== 1 ? 'is' : ''}</span>
        <span className="evolution-pill">
          Último ponto: {latestSnapshot.matchId} · {PHASE_CONFIG[latestSnapshot.phase]?.label ?? latestSnapshot.phase}
        </span>
      </div>

      <div className="evolution-card">
        <div className="evolution-toolbar">
          <div className="evolution-toggle-group" role="tablist" aria-label="Modo do gráfico">
            <button
              type="button"
              className={`evolution-toggle ${metric === 'position' ? 'active' : ''}`}
              onClick={() => setMetric('position')}
            >
              Posições
            </button>
            <button
              type="button"
              className={`evolution-toggle ${metric === 'points' ? 'active' : ''}`}
              onClick={() => setMetric('points')}
            >
              Pontos
            </button>
          </div>

          <div className="evolution-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={showAllPlayers}>
              Mostrar todos
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={showTopPlayers}>
              Top 5
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearPlayers}>
              Limpar
            </button>
          </div>
        </div>

        {visibleSeries.length === 0 ? (
          <div className="empty-state">
            <span>Nenhum jogador selecionado no gráfico.</span>
            <span>Escolha pelo menos um participante na legenda abaixo.</span>
          </div>
        ) : (
          <div
            ref={chartAreaRef}
            className="evolution-chart-area"
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="evolution-chart-scroll">
              <svg
                className="evolution-chart"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={metric === 'position'
                  ? 'Gráfico da evolução das posições dos participantes'
                  : 'Gráfico da evolução dos pontos acumulados dos participantes'}
              >
                <g className="evolution-grid">
                  {metric === 'position' ? (
                    Array.from({ length: players.length }, (_, index) => {
                      const position = index + 1
                      const y = yForValue(position)

                      return (
                        <g key={`y-${position}`}>
                          <line x1={margin.left} y1={y} x2={chartWidth - margin.right} y2={y} />
                          <text x={margin.left - 12} y={y + 4} className="evolution-axis-label">
                            {position}
                          </text>
                        </g>
                      )
                    })
                  ) : (
                    pointTicks.map(value => {
                      const y = yForValue(value)

                      return (
                        <g key={`y-${value}`}>
                          <line x1={margin.left} y1={y} x2={chartWidth - margin.right} y2={y} />
                          <text x={margin.left - 12} y={y + 4} className="evolution-axis-label">
                            {value}
                          </text>
                        </g>
                      )
                    })
                  )}

                  {history.map((snapshot, index) => {
                    const step = index + 1
                    const x = xForStep(step)
                    const showTick = index === 0 || index === history.length - 1 || step % tickEvery === 0

                    if (!showTick) return null

                    return (
                      <g key={`x-${snapshot.matchId}`}>
                        <line x1={x} y1={margin.top} x2={x} y2={chartHeight - margin.bottom} />
                        <text x={x} y={chartHeight - 18} textAnchor="middle" className="evolution-axis-label">
                          {snapshot.matchId}
                        </text>
                      </g>
                    )
                  })}
                </g>

                {visibleSeries.map(player => (
                  <g key={player.playerId} style={{ '--player-color': player.color }}>
                    <path className="evolution-line" d={buildPath(player.points, xForStep, yForValue, metric)} />
                    {player.points.map(point => {
                      const yValue = metric === 'position' ? point.position : point.total

                      return (
                        <circle
                          key={`${player.playerId}-${point.matchId}`}
                          className="evolution-point"
                          cx={xForStep(point.step)}
                          cy={yForValue(yValue)}
                          r="4"
                          tabIndex="0"
                          onMouseEnter={event => updateTooltip(event, player, point)}
                          onMouseMove={event => updateTooltip(event, player, point)}
                          onFocus={event => updateTooltip(event, player, point)}
                          onBlur={() => setTooltip(null)}
                        />
                      )
                    })}
                  </g>
                ))}
              </svg>
            </div>

            {tooltip && (
              <div
                className="evolution-tooltip"
                style={{ left: tooltip.left, top: tooltip.top }}
              >
                <strong style={{ color: tooltip.player.color }}>{tooltip.player.name}</strong>
                <span>{tooltip.point.matchId} · {PHASE_CONFIG[tooltip.point.phase]?.label ?? tooltip.point.phase}</span>
                <span>{formatMatchMoment(tooltip.point.date)}</span>
                <span>Posição: #{tooltip.point.position}</span>
                <span>Pontos acumulados: {tooltip.point.total}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="evolution-legend">
        {series.map(player => {
          const active = selectedPlayerIds.includes(player.playerId)

          return (
            <button
              key={player.playerId}
              type="button"
              className={`evolution-legend-item ${active ? 'active' : 'inactive'}`}
              onClick={() => togglePlayer(player.playerId)}
            >
              <span className="evolution-color" style={{ '--player-color': player.color }} />
              <div>
                <strong>{player.name}</strong>
                <span>Posição atual #{player.latestPosition} • {player.latestTotal} pts</span>
                <span>{active ? 'Clique para ocultar' : 'Clique para mostrar'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
