import { Fragment } from 'react'
import { calcRanking, formatPoints, withRankingPositions } from '../utils/scoring.js'

const MEDALS = ['🥇', '🥈', '🥉']
const RELEGATION_MIN_PLAYERS = 4

export function Ranking({ players, bets, results, matches }) {
  const rankedPlayers = withRankingPositions(calcRanking(players, bets, results, matches))
  const total = rankedPlayers.length
  const umbralStartIndex = total >= RELEGATION_MIN_PLAYERS ? total - 3 : null

  if (players.length === 0) {
    return (
      <div className="empty-state">
        <span>Nenhum jogador cadastrado ainda.</span>
        <span>Vá em "Jogadores" para adicionar participantes.</span>
      </div>
    )
  }

  return (
    <div className="ranking">
      <h2 className="section-title">Classificação</h2>
      <div className="ranking-header">
        <span className="col-pos">#</span>
        <span className="col-name">Jogador</span>
        <span className="col-pts">Pontos</span>
        <span className="col-bets">Desempenho</span>
      </div>

      {rankedPlayers.map((player, i) => {
        const betCount    = (bets[player.id] ?? []).length
        const resultCount = results.length
        const isUmbralStart = umbralStartIndex !== null && i === umbralStartIndex
        const relegationSlot = umbralStartIndex !== null && i >= umbralStartIndex
          ? i - umbralStartIndex + 1
          : null

        return (
          <Fragment key={player.id}>
            {isUmbralStart && (
              <div className="ranking-umbral-divider" aria-hidden="true">
                <span>UMBRAL</span>
              </div>
            )}

            <div className={[
              'ranking-row',
              `rank-${i + 1}`,
              relegationSlot ? `ranking-row--relegation-${relegationSlot}` : '',
            ].filter(Boolean).join(' ')}>
            <span className="col-pos">
              {MEDALS[player.position - 1] ?? <span className="rank-num">{player.position}</span>}
            </span>
            <span className="col-name">{player.name}</span>
            <span className="col-pts">
              <strong>{formatPoints(player.total)}</strong>
              <small>pts</small>
            </span>
            <span className="col-bets">
              <span className="bet-stat exact">{player.exactHits} {player.exactHits === 1 ? 'CRAVADA' : 'CRAVADAS'}</span>
              {resultCount > 0 && (
                <span className="bet-stat accent">{player.scoredHits}/{resultCount} pontuaram</span>
              )}
              <span className="bet-stat bet-stat--desktop">{betCount} palpites</span>
            </span>
            </div>
          </Fragment>
        )
      })}

      {results.length > 0 && (
        <div className="ranking-footer">
          {results.length} resultado{results.length !== 1 ? 's' : ''} registrado{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
