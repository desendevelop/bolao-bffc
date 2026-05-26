import { calcRanking } from '../utils/scoring.js'
import { PHASE_CONFIG, MATCHES } from '../data/matches.js'

const MEDALS = ['🥇', '🥈', '🥉']

export function Ranking({ players, bets, results }) {
  const ranking = calcRanking(players, bets, results, MATCHES)

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

      {ranking.map((player, i) => {
        const betCount    = (bets[player.id] ?? []).length
        const resultCount = results.length
        const scoredCount = (player.breakdown ?? []).filter(b => b.points > 0).length

        return (
          <div key={player.id} className={`ranking-row rank-${i + 1}`}>
            <span className="col-pos">
              {MEDALS[i] ?? <span className="rank-num">{i + 1}</span>}
            </span>
            <span className="col-name">{player.name}</span>
            <span className="col-pts">
              <strong>{player.total}</strong>
              <small>pts</small>
            </span>
            <span className="col-bets">
              <span className="bet-stat">{betCount} palpites</span>
              {resultCount > 0 && (
                <span className="bet-stat accent">{scoredCount}/{resultCount} pontuaram</span>
              )}
            </span>
          </div>
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
