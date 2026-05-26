import { useEffect, useMemo, useState } from 'react'
import { PHASE_CONFIG } from '../data/matches.js'
import { Shield, Save, Trash2, Lock, Wand2, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react'

function stepScoreValue(value, delta) {
  const current = value === '' ? 0 : Number(value)
  return Math.max(0, Math.min(99, current + delta))
}

function ScoreInput({ value, onChange }) {
  return (
    <div className="score-stepper">
      <button
        type="button"
        className="score-step-btn"
        onClick={() => onChange(stepScoreValue(value, -1))}
        disabled={value === '' || Number(value) <= 0}
        aria-label="Diminuir gols"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        className="score-input"
        min="0"
        max="99"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 2) === '' ? '' : Number(e.target.value.replace(/\D/g, '').slice(0, 2)))}
        placeholder="0"
      />
      <button
        type="button"
        className="score-step-btn"
        onClick={() => onChange(stepScoreValue(value, 1))}
        disabled={value !== '' && Number(value) >= 99}
        aria-label="Aumentar gols"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

function formatAdminMatchDate(dateString) {
  if (!dateString) return 'Sem data'
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isoToDateTimeLocalValue(dateString) {
  return typeof dateString === 'string' && dateString.length >= 16
    ? dateString.slice(0, 16)
    : ''
}

function dateTimeLocalValueToIso(value) {
  if (!value) return ''
  return `${value}:00-03:00`
}

function ResultInput({
  match,
  currentResult,
  currentOverride,
  currentSchedule,
  onSave,
  onRemove,
  onSaveOverride,
  onClearOverride,
  onSaveSchedule,
  onClearSchedule,
}) {
  const [home, setHome] = useState(currentResult?.homeGoals ?? '')
  const [away, setAway] = useState(currentResult?.awayGoals ?? '')
  const [winnerSide, setWinnerSide] = useState(currentResult?.winnerSide ?? '')
  const [overrideHome, setOverrideHome] = useState(currentOverride?.home ?? match.home)
  const [overrideAway, setOverrideAway] = useState(currentOverride?.away ?? match.away)
  const [overrideFeedback, setOverrideFeedback] = useState('')
  const [scheduledDate, setScheduledDate] = useState(isoToDateTimeLocalValue(currentSchedule?.date ?? match.date))
  const [scheduleFeedback, setScheduleFeedback] = useState('')
  const isKnockout = match.phase !== 'group'
  const isDraw = home !== '' && away !== '' && Number(home) === Number(away)

  useEffect(() => {
    setHome(currentResult?.homeGoals ?? '')
    setAway(currentResult?.awayGoals ?? '')
    setWinnerSide(currentResult?.winnerSide ?? '')
  }, [currentResult?.matchId, currentResult?.homeGoals, currentResult?.awayGoals, currentResult?.winnerSide])

  useEffect(() => {
    setOverrideHome(currentOverride?.home ?? match.home)
    setOverrideAway(currentOverride?.away ?? match.away)
    setOverrideFeedback('')
  }, [currentOverride?.home, currentOverride?.away, match.home, match.away])

  useEffect(() => {
    setScheduledDate(isoToDateTimeLocalValue(currentSchedule?.date ?? match.date))
    setScheduleFeedback('')
  }, [currentSchedule?.date, match.date])

  const handleSave = () => {
    if (home === '' || away === '') return
    if (isKnockout && isDraw && !winnerSide) return
    onSave(match.id, Number(home), Number(away), isKnockout && isDraw ? winnerSide : null)
  }

  const handleSaveOverride = async () => {
    try {
      await onSaveOverride(match.id, overrideHome, overrideAway)
      setOverrideFeedback('Ajuste manual salvo.')
    } catch (error) {
      setOverrideFeedback(error?.message ?? 'Não foi possível salvar o ajuste.')
    }
  }

  const handleClearOverride = async () => {
    await onClearOverride(match.id)
    setOverrideFeedback('Ajuste manual removido.')
  }

  const handleSaveSchedule = async () => {
    try {
      await onSaveSchedule(match.id, dateTimeLocalValueToIso(scheduledDate))
      setScheduleFeedback('Data do jogo salva.')
    } catch (error) {
      setScheduleFeedback(error?.message ?? 'Nao foi possivel salvar a data.')
    }
  }

  const handleClearSchedule = async () => {
    await onClearSchedule(match.id)
    setScheduleFeedback('Data personalizada removida.')
  }

  return (
    <div className={`result-row ${currentResult ? 'has-result' : ''}`}>
      <div className="result-match-info">
        <span className="match-id-badge">{match.id}</span>
        <div className="admin-match-summary">
          <span className="teams-label">{match.home} × {match.away}</span>
          <span className="venue-label">{match.venue}</span>
          <span className="schedule-label">
            {formatAdminMatchDate(match.date)} BRT
            {currentSchedule && <span className="override-badge">Data alterada</span>}
          </span>
        </div>
      </div>
      <div className="result-inputs">
        <ScoreInput value={home} onChange={setHome} />
        <span>×</span>
        <ScoreInput value={away} onChange={setAway} />
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={home === '' || away === '' || (isKnockout && isDraw && !winnerSide)}
        >
          <Save size={13} /> Salvar
        </button>
        {currentResult && (
          <button className="btn btn-sm btn-ghost danger" onClick={() => onRemove(match.id)} title="Remover resultado">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {isKnockout && isDraw && (
        <div className="winner-toggle-row">
          <span className="control-label">Quem avançou?</span>
          <button
            type="button"
            className={`btn btn-sm ${winnerSide === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWinnerSide('home')}
          >
            {match.home}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${winnerSide === 'away' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setWinnerSide('away')}
          >
            {match.away}
          </button>
        </div>
      )}
      <div className="override-card">
        <div className="override-card-header">
          <span className="control-label">Agendamento do jogo</span>
          <span className="override-badge">Horario de Brasilia</span>
        </div>
        <div className="schedule-editor">
          <input
            type="datetime-local"
            className="input-field"
            value={scheduledDate}
            onChange={event => {
              setScheduledDate(event.target.value)
              setScheduleFeedback('')
            }}
          />
          <div className="override-actions">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleSaveSchedule}
              disabled={!scheduledDate}
            >
              <Save size={13} />
              Salvar data
            </button>
            {currentSchedule && (
              <button type="button" className="btn btn-sm btn-ghost danger" onClick={handleClearSchedule}>
                <Trash2 size={13} />
                Voltar ao padrao
              </button>
            )}
          </div>
        </div>
        <span className="schedule-help">
          Se precisar corrigir um horario sem deploy, ajuste aqui. A trava dos palpites acompanha essa data.
        </span>
        {scheduleFeedback && <span className="override-feedback">{scheduleFeedback}</span>}
      </div>
      {isKnockout && (
        <div className="override-card">
          <div className="override-card-header">
            <span className="control-label">Fallback manual do confronto</span>
            {currentOverride && <span className="override-badge">Override ativo</span>}
          </div>
          <div className="override-row">
            <input
              className="input-field"
              value={overrideHome}
              onChange={event => {
                setOverrideHome(event.target.value)
                setOverrideFeedback('')
              }}
              placeholder="Time mandante"
            />
            <span>×</span>
            <input
              className="input-field"
              value={overrideAway}
              onChange={event => {
                setOverrideAway(event.target.value)
                setOverrideFeedback('')
              }}
              placeholder="Time visitante"
            />
          </div>
          <div className="override-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={handleSaveOverride}>
              <Wand2 size={13} />
              Salvar times
            </button>
            {currentOverride && (
              <button type="button" className="btn btn-sm btn-ghost danger" onClick={handleClearOverride}>
                <Trash2 size={13} />
                Limpar ajuste
              </button>
            )}
          </div>
          {overrideFeedback && <span className="override-feedback">{overrideFeedback}</span>}
        </div>
      )}
      {currentResult && (
        <span className="result-confirmed">✓ {currentResult.homeGoals} × {currentResult.awayGoals}</span>
      )}
    </div>
  )
}

function formatReviewDate(dateString) {
  if (!dateString) return 'Sem revisão'
  return new Date(dateString).toLocaleString('pt-BR')
}

function AccessRequestCard({ request, pendingAction, onApprove, onReject, onDelete }) {
  const isPending = request.status === 'pending'
  const isApproved = request.status === 'approved'
  const isRejected = request.status === 'rejected'

  return (
    <div className={`access-request-card status-${request.status}`}>
      <div className="access-request-main">
        <strong>{request.name}</strong>
        <span>{request.email}</span>
      </div>

      <div className="access-request-meta">
        <span>Solicitado em {formatReviewDate(request.requestedAt)}</span>
        {request.reviewedAt && (
          <span>Revisado em {formatReviewDate(request.reviewedAt)}</span>
        )}
      </div>

      <div className="access-request-actions">
        {!isApproved && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => onApprove(request.id)}
            disabled={pendingAction === request.id}
          >
            Aprovar
          </button>
        )}

        {!isPending && (
          <button
            type="button"
            className="btn btn-sm btn-ghost danger"
            onClick={() => onReject(request.id)}
            disabled={pendingAction === request.id}
          >
            Rejeitar
          </button>
        )}

        {isPending && (
          <button
            type="button"
            className="btn btn-sm btn-ghost danger"
            onClick={() => onReject(request.id)}
            disabled={pendingAction === request.id}
          >
            Rejeitar
          </button>
        )}

        {isRejected && (
          <button
            type="button"
            className="btn btn-sm btn-ghost danger"
            onClick={() => onDelete(request.id)}
            disabled={pendingAction === request.id}
          >
            <Trash2 size={13} />
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}

export function Admin({
  currentUser,
  canManageResults,
  adminReady,
  accessRequests,
  reviewAccessRequest,
  deleteRejectedAccessRequest,
  matches,
  matchOverrides,
  matchSchedule,
  results,
  setResult,
  removeResult,
  saveMatchOverride,
  clearMatchOverride,
  saveMatchSchedule,
  clearMatchSchedule,
}) {
  const [phaseFilter, setPhaseFilter] = useState('group')
  const [pendingAction, setPendingAction] = useState('')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [requestsExpanded, setRequestsExpanded] = useState(false)

  const resultMap = useMemo(
    () => Object.fromEntries(results.map(r => [r.matchId, r])),
    [results]
  )

  const filteredMatches = matches.filter(m => m.phase === phaseFilter)
  const pendingRequests = accessRequests.filter(request => request.status === 'pending')
  const approvedRequests = accessRequests.filter(request => request.status === 'approved')
  const rejectedRequests = accessRequests.filter(request => request.status === 'rejected')

  useEffect(() => {
    if (pendingRequests.length > 0) {
      setRequestsExpanded(true)
    }
  }, [pendingRequests.length])

  const handleReview = async (requestId, status) => {
    setPendingAction(requestId)
    const result = await reviewAccessRequest(requestId, status)
    setPendingAction('')
    setReviewFeedback(
      result?.ok
        ? (status === 'approved' ? 'Cadastro aprovado.' : 'Cadastro movido para rejeitados.')
        : (result?.error ?? 'Não foi possível revisar o cadastro.')
    )
  }

  const handleDeleteRejected = async (requestId) => {
    setPendingAction(requestId)
    const result = await deleteRejectedAccessRequest(requestId)
    setPendingAction('')
    setReviewFeedback(
      result?.ok
        ? 'Cadastro rejeitado excluído do banco do bolão.'
        : (result?.error ?? 'Não foi possível excluir o cadastro.')
    )
  }

  if (!adminReady) {
    return (
      <div className="admin-lock">
        <Shield size={40} />
        <h2>Área do Administrador</h2>
        <p>Verificando permissões da sua conta…</p>
      </div>
    )
  }

  if (!canManageResults) {
    return (
      <div className="admin-lock">
        <Lock size={40} />
        <h2>Acesso restrito</h2>
        <p>
          Esta conta não está marcada como administradora no Firebase.
          Use a conta admin ou adicione o seu UID em <code>/admins/{currentUser?.uid}</code> com valor <code>true</code>.
        </p>
        <small>{currentUser?.email}</small>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <Shield size={20} />
        <h2 className="section-title">Painel Admin</h2>
        <span className="admin-badge">Conta autorizada</span>
      </div>

      <div className="admin-request-section">
        <button
          type="button"
          className={`admin-request-toggle ${requestsExpanded ? 'expanded' : ''}`}
          onClick={() => setRequestsExpanded(current => !current)}
        >
          <div className="admin-request-toggle-main">
            <span className="admin-request-toggle-title">Cadastros para revisão</span>
            <span className="admin-request-toggle-subtitle">
              Pendentes ficam na fila principal. Rejeitados aparecem separados e podem ser aprovados depois.
            </span>
          </div>
          <div className="admin-request-toggle-side">
            {pendingRequests.length > 0 && (
              <span className="admin-request-notification">
                {pendingRequests.length}
              </span>
            )}
            <span className="admin-request-pill">
              {pendingRequests.length} pendente{pendingRequests.length !== 1 ? 's' : ''}
            </span>
            {requestsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {requestsExpanded && (
          <>
            {reviewFeedback && <p className="override-feedback">{reviewFeedback}</p>}

            <div className="admin-request-groups">
              <div className="admin-request-group">
                <div className="admin-request-group-header">
                  <strong>Pendentes</strong>
                  <span>{pendingRequests.length}</span>
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="empty-text">Nenhum cadastro pendente no momento.</p>
                ) : (
                  pendingRequests.map(request => (
                    <AccessRequestCard
                      key={request.id}
                      request={request}
                      pendingAction={pendingAction}
                      onApprove={requestId => handleReview(requestId, 'approved')}
                      onReject={requestId => handleReview(requestId, 'rejected')}
                      onDelete={handleDeleteRejected}
                    />
                  ))
                )}
              </div>

              <div className="admin-request-group">
                <div className="admin-request-group-header">
                  <strong>Aprovados</strong>
                  <span>{approvedRequests.length}</span>
                </div>

                {approvedRequests.length === 0 ? (
                  <p className="empty-text">Nenhum cadastro aprovado ainda.</p>
                ) : (
                  approvedRequests.map(request => (
                    <AccessRequestCard
                      key={request.id}
                      request={request}
                      pendingAction={pendingAction}
                      onApprove={requestId => handleReview(requestId, 'approved')}
                      onReject={requestId => handleReview(requestId, 'rejected')}
                      onDelete={handleDeleteRejected}
                    />
                  ))
                )}
              </div>

              <div className="admin-request-group">
                <div className="admin-request-group-header">
                  <strong>Rejeitados</strong>
                  <span>{rejectedRequests.length}</span>
                </div>

                {rejectedRequests.length === 0 ? (
                  <p className="empty-text">Nenhum cadastro rejeitado.</p>
                ) : (
                  rejectedRequests.map(request => (
                    <AccessRequestCard
                      key={request.id}
                      request={request}
                      pendingAction={pendingAction}
                      onApprove={requestId => handleReview(requestId, 'approved')}
                      onReject={requestId => handleReview(requestId, 'rejected')}
                      onDelete={handleDeleteRejected}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="phase-tabs">
        {Object.entries(PHASE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`phase-tab ${phaseFilter === key ? 'active' : ''}`}
            onClick={() => setPhaseFilter(key)}
          >
            {cfg.label}
            <span className="tab-mult">{cfg.multiplier}×</span>
          </button>
        ))}
      </div>

      <div className="results-list">
        {filteredMatches.length === 0 ? (
          <p className="empty-text">Nenhum jogo nesta fase.</p>
        ) : (
          filteredMatches.map(match => (
            <ResultInput
              key={match.id}
              match={match}
              currentResult={resultMap[match.id] ?? null}
              currentOverride={matchOverrides?.[match.id] ?? null}
              currentSchedule={matchSchedule?.[match.id] ?? null}
              onSave={setResult}
              onRemove={removeResult}
              onSaveOverride={saveMatchOverride}
              onClearOverride={clearMatchOverride}
              onSaveSchedule={saveMatchSchedule}
              onClearSchedule={clearMatchSchedule}
            />
          ))
        )}
      </div>
    </div>
  )
}
