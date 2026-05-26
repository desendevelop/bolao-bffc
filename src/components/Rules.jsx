import { PHASE_CONFIG } from '../data/matches.js'

export function Rules() {
  return (
    <div className="rules">
      <h2 className="section-title">Como funciona o Bolão</h2>

      <div className="rules-block">
        <h3>Sistema de pontuação</h3>
        <p>
          Para cada jogo, você palpita no placar final. O sistema calcula seus
          pontos automaticamente com base nas seguintes regras:
        </p>

        <table className="rules-table">
          <thead>
            <tr>
              <th>Situação</th>
              <th>Pts base</th>
            </tr>
          </thead>
          <tbody>
            <tr className="zero">
              <td>Errou o vencedor <strong>E</strong> o placar</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Acertou o vencedor, errou o placar</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Acertou o vencedor + gols de 1 dos times (mas não o placar exato)</td>
              <td>2</td>
            </tr>
            <tr className="highlight">
              <td>Acertou o vencedor + placar exato 🎯</td>
              <td>5</td>
            </tr>
            <tr>
              <td>Acertou empate, errou o placar</td>
              <td>2</td>
            </tr>
            <tr className="highlight">
              <td>Acertou empate + placar exato 🎯</td>
              <td>5</td>
            </tr>
            <tr className="muted">
              <td>Esqueceu de palpitar 😢</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rules-block">
        <h3>Multiplicadores por fase</h3>
        <p>
          Os pontos base são multiplicados conforme a importância da fase.
          Os pontos finais são sempre arredondados para cima.
        </p>

        <div className="phase-cards">
          {Object.entries(PHASE_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`phase-card phase-${key}`}>
              <span className="phase-label">{cfg.label}</span>
              <span className="phase-mult">{cfg.multiplier}×</span>
            </div>
          ))}
        </div>

        <div className="rules-example">
          <strong>Exemplo:</strong> Você palpita 2×1 e o resultado é 2×0. Você acertou
          o vencedor e os gols do time da casa → 2 pontos base. Na Semifinal (4×): <strong>8 pontos</strong>.
        </div>
      </div>

      <div className="rules-block">
        <h3>Desempate do ranking</h3>
        <p>
          Se dois ou mais participantes terminarem com a mesma pontuação total,
          o desempate segue esta ordem: <strong>mais placares exatos</strong>,
          depois <strong>mais jogos em que pontuou</strong>. Se ainda assim
          continuar empatado, o ranking mostra <strong>empate real</strong>.
        </p>
      </div>

      <div className="rules-block">
        <h3>⏰ Prazo para palpitar</h3>
        <p>
          Palpites só são aceitos até <strong>10 minutos antes do início</strong> de cada
          partida. Após esse prazo, o jogo fica bloqueado e quem não palpitou marca
          <strong> 0 pontos</strong>.
        </p>
        <p>
          Depois que a trava de um jogo fecha, os palpites desse jogo ficam
          <strong> visíveis para todos os participantes</strong> e continuam disponíveis
          para consulta até o fim do bolão.
        </p>
      </div>

      <div className="rules-block">
        <h3>ℹ️ Fase eliminatória</h3>
        <p>
          Nos jogos a partir da Rodada de 32, os confrontos são definidos conforme
          o avanço das seleções na fase de grupos. Assim que a FIFA confirmar os
          confrontos, o administrador do bolão atualiza os times nas partidas.
        </p>
      </div>
    </div>
  )
}
