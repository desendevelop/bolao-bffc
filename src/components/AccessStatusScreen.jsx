import { Clock3, LogOut, ShieldX } from 'lucide-react'

export function AccessStatusScreen({ accessStatus, accessRequest, onSignOut }) {
  const isRejected = accessStatus === 'rejected'

  return (
    <div className="auth-shell">
      <div className="auth-card access-card">
        <div className="auth-header">
          <span className="auth-badge">{isRejected ? 'Cadastro não aprovado' : 'Cadastro em análise'}</span>
          <h1>{isRejected ? 'Acesso bloqueado no momento' : 'Aguardando aprovação do admin'}</h1>
          <p>
            {isRejected
              ? 'Seu cadastro foi analisado, mas ainda não foi aprovado para entrar no bolão. Se necessário, o admin pode aprovar depois.'
              : 'Sua conta foi criada com sucesso, mas o acesso ao bolão só é liberado depois da aprovação manual do administrador.'}
          </p>
        </div>

        <div className="access-card-summary">
          <div>
            <strong>Nome enviado</strong>
            <span>{accessRequest?.name ?? 'Participante'}</span>
          </div>
          <div>
            <strong>E-mail</strong>
            <span>{accessRequest?.email ?? 'Sem e-mail disponível'}</span>
          </div>
          {accessRequest?.requestedAt && (
            <div>
              <strong>Solicitado em</strong>
              <span>{new Date(accessRequest.requestedAt).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>

        <div className={`access-card-note ${isRejected ? 'rejected' : ''}`}>
          {isRejected ? <ShieldX size={16} /> : <Clock3 size={16} />}
          <span>
            {isRejected
              ? 'Este cadastro fica em uma lista separada no painel admin e pode ser aprovado depois.'
              : 'Enquanto o status estiver pendente, voce não consegue entrar no bolão nem visualizar os dados internos.'}
          </span>
        </div>

        <button type="button" className="btn btn-ghost auth-submit" onClick={onSignOut}>
          <LogOut size={15} />
          Sair desta conta
        </button>
      </div>
    </div>
  )
}
