import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { isMatchPast } from '../data/matches.js'

export function PastMatchesGroup({ matches, renderMatch, className = '', excludeIds = null }) {
  const [expanded, setExpanded] = useState(false)

  const visibleMatches = useMemo(() => {
    if (!excludeIds?.size) return matches
    return matches.filter(match => !excludeIds.has(match.id))
  }, [matches, excludeIds])

  const { past, upcoming } = useMemo(() => {
    const past = []
    const upcoming = []
    for (const match of visibleMatches) {
      if (isMatchPast(match.date)) past.push(match)
      else upcoming.push(match)
    }
    return { past, upcoming }
  }, [visibleMatches])

  if (past.length === 0) {
    return <>{visibleMatches.map(renderMatch)}</>
  }

  return (
    <div className={`past-matches-group ${className}`.trim()}>
      <div className="past-matches-section">
        <button
          type="button"
          className={`past-matches-toggle ${expanded ? 'expanded' : ''}`}
          onClick={() => setExpanded(current => !current)}
          aria-expanded={expanded}
        >
          <span className="past-matches-toggle-label">Jogos já realizados</span>
          <span className="past-matches-toggle-meta">
            <span className="past-matches-count">
              {past.length} jogo{past.length !== 1 ? 's' : ''}
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {expanded && (
          <div className="past-matches-content">
            {past.map(renderMatch)}
          </div>
        )}
      </div>

      {upcoming.map(renderMatch)}
    </div>
  )
}
