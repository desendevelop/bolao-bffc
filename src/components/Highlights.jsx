import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { calcRanking } from '../utils/scoring.js'
import { getStaticRoundHighlight, isStaticHighlightPublished } from '../data/roundHighlights.js'
import { HIGHLIGHT_ROUNDS, getHighlightRound, getRoundMatches, getRoundResultStatus } from '../data/rounds.js'

function HighlightBlock({ variant, playerName, roleLabel, imageSrc, text }) {
  const isLeader = variant === 'leader'

  return (
    <article className={`highlight-block highlight-block--${variant}`}>
      <header className="highlight-block-header">
        <span className="highlight-block-tag">{isLeader ? 'Destaque' : 'UMBRAL'}</span>
        <strong className="highlight-block-name">{playerName}</strong>
        <span className="highlight-block-role">{roleLabel}</span>
      </header>

      <img
        className="highlight-block-image"
        src={imageSrc}
        alt={`${isLeader ? 'Destaque' : 'UMBRAL'} de ${playerName}`}
      />

      {text && <p className="highlight-block-text">{text}</p>}
    </article>
  )
}

export function Highlights({ players, bets, results, matches, selectedRound, onRoundChange }) {
  const round = getHighlightRound(selectedRound)
  const roundMatches = useMemo(
    () => getRoundMatches(matches, selectedRound),
    [matches, selectedRound],
  )

  const roundStatus = useMemo(
    () => getRoundResultStatus(roundMatches, results),
    [roundMatches, results],
  )

  const { totalGames, gamesWithResult, isComplete } = roundStatus
  const published = getStaticRoundHighlight(selectedRound)
  const hasPublishedContent = isStaticHighlightPublished(published)

  const roundRanking = useMemo(
    () => calcRanking(players, bets, results, roundMatches),
    [players, bets, results, roundMatches],
  )

  const highlightLeader = roundRanking[0] ?? null
  const highlightUmbral = roundRanking.length > 0
    ? roundRanking[roundRanking.length - 1]
    : null

  return (
    <div className="highlights-panel">
      <h2 className="section-title">Destaques</h2>

      <div className="highlights-toolbar">
        <label className="control-label" htmlFor="highlights-round">Rodada</label>
        <select
          id="highlights-round"
          className="select-field"
          value={selectedRound}
          onChange={event => onRoundChange(event.target.value)}
        >
          {HIGHLIGHT_ROUNDS.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {gamesWithResult === 0 ? (
        <div className="highlights-empty">
          <p>Ainda não há resultados lançados para <strong>{round.label}</strong>.</p>
          <p className="highlights-empty-hint">Os destaques desta rodada serão publicados depois que ela terminar.</p>
        </div>
      ) : !isComplete ? (
        <div className="highlights-empty highlights-empty--pending">
          <p><strong>{round.label}</strong> ainda em andamento.</p>
          <p className="highlights-empty-hint">
            {gamesWithResult} de {totalGames} jogos já têm resultado.
            Os destaques serão liberados quando a rodada inteira terminar.
          </p>
        </div>
      ) : !hasPublishedContent ? (
        <div className="highlights-empty highlights-empty--pending">
          <p>Destaques de <strong>{round.label}</strong> em breve.</p>
          <p className="highlights-empty-hint">
            A rodada já terminou. As imagens e os textos serão publicados em breve.
          </p>
        </div>
      ) : (
        <>
          <p className="highlights-intro">
            <strong>{round.label}</strong> (só jogos da rodada):
            {' '}destaque <strong>{highlightLeader?.name ?? '—'}</strong>
            {highlightLeader && <>({highlightLeader.total} pts)</>}
            {highlightUmbral && highlightUmbral.id !== highlightLeader?.id && (
              <>
                {' '}· UMBRAL <strong>{highlightUmbral.name}</strong>
                ({highlightUmbral.total} pts)
              </>
            )}
          </p>

          <div className="highlights-grid">
            {highlightLeader && published.leaderImage && (
              <HighlightBlock
                variant="leader"
                playerName={highlightLeader.name}
                roleLabel={`Mais pontos na ${round.label}`}
                imageSrc={published.leaderImage}
                text={published.leaderText}
              />
            )}
            {highlightUmbral && highlightUmbral.id !== highlightLeader?.id && published.umbralImage && (
              <HighlightBlock
                variant="umbral"
                playerName={highlightUmbral.name}
                roleLabel={`Menos pontos na ${round.label}`}
                imageSrc={published.umbralImage}
                text={published.umbralText}
              />
            )}
          </div>

          {published.article && (
            <div className="highlights-article">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {published.article}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}
    </div>
  )
}
