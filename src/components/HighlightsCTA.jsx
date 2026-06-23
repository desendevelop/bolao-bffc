import { useEffect, useRef, useState } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { HIGHLIGHT_ROUNDS } from '../data/rounds.js'

export function HighlightsCTA({ selectedRound, onSelectRound, onOpen }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectedLabel = HIGHLIGHT_ROUNDS.find(round => round.id === selectedRound)?.label ?? 'Rodada'

  function handleSelect(roundId) {
    onSelectRound(roundId)
    onOpen()
    setOpen(false)
  }

  return (
    <div className="highlights-cta" ref={rootRef}>
      <button
        type="button"
        className={`highlights-cta-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Sparkles size={15} />
        <span>Destaques</span>
        <ChevronDown size={14} className="highlights-cta-chevron" />
      </button>

      {open && (
        <div className="highlights-cta-menu" role="listbox" aria-label="Escolher rodada">
          {HIGHLIGHT_ROUNDS.map(round => (
            <button
              key={round.id}
              type="button"
              role="option"
              aria-selected={round.id === selectedRound}
              className={`highlights-cta-option ${round.id === selectedRound ? 'active' : ''}`}
              onClick={() => handleSelect(round.id)}
            >
              {round.label}
            </button>
          ))}
        </div>
      )}

      <span className="highlights-cta-current">{selectedLabel}</span>
    </div>
  )
}
