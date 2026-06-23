import { useMemo } from 'react'
import { Radio } from 'lucide-react'
import { formatLiveElapsed, partitionLiveMatches } from '../data/matches.js'
import { useNow } from '../hooks/useNow.js'

export function useLiveMatchIds(matches) {
  const now = useNow()

  return useMemo(() => {
    const { live } = partitionLiveMatches(matches, now)
    return new Set(live.map(match => match.id))
  }, [matches, now])
}

export function LiveMatchSection({ matches, renderMatch }) {
  const now = useNow()

  const liveMatches = useMemo(
    () => partitionLiveMatches(matches, now).live,
    [matches, now],
  )

  if (liveMatches.length === 0) return null

  return (
    <section className="live-match-section" aria-label="Jogo ao vivo">
      <div className="live-match-section-header">
        <span className="live-badge">
          <Radio size={12} />
          AO VIVO
        </span>
        <span className="live-match-section-title">
          {liveMatches.length === 1 ? 'Jogo em andamento' : `${liveMatches.length} jogos em andamento`}
        </span>
      </div>

      <div className="live-match-section-body">
        {liveMatches.map(match => (
          <div key={match.id} className="live-match-slot">
            <div className="live-match-slot-meta">
              <span className="live-elapsed">{formatLiveElapsed(match.date, now)}</span>
              {match.venue && <span>{match.venue}</span>}
            </div>
            {renderMatch(match)}
          </div>
        ))}
      </div>
    </section>
  )
}
