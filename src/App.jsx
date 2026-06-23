import { useState } from 'react'
import { Trophy, TrendingUp, CalendarDays, Users, ClipboardList, BookOpen, Shield, Wifi, WifiOff, LogOut } from 'lucide-react'
import { AuthScreen } from './components/AuthScreen.jsx'
import { AccessStatusScreen } from './components/AccessStatusScreen.jsx'
import { useBolao } from './hooks/useBolao.js'
import { useAuth } from './hooks/useAuth.js'
import bffcLogo from './assets/bffc-logo.png'
import { Ranking }  from './components/Ranking.jsx'
import { Evolution } from './components/Evolution.jsx'
import { DayBets } from './components/DayBets.jsx'
import { Players }  from './components/Players.jsx'
import { Bets }     from './components/Bets.jsx'
import { Rules }    from './components/Rules.jsx'
import { Admin }    from './components/Admin.jsx'
import { Highlights } from './components/Highlights.jsx'
import { HighlightsCTA } from './components/HighlightsCTA.jsx'
import './styles.css'

const TABS = [
  { id: 'ranking',  label: 'Ranking',   icon: Trophy },
  { id: 'evolution', label: 'Evolução', icon: TrendingUp },
  { id: 'bets',     label: 'Palpites',  icon: ClipboardList },
  { id: 'day-bets', label: 'Palpites do dia', icon: CalendarDays },
  { id: 'players',  label: 'Perfil',    icon: Users },
  { id: 'rules',    label: 'Regras',    icon: BookOpen },
  { id: 'admin',    label: 'Admin',     icon: Shield },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('ranking')
  const [highlightRound, setHighlightRound] = useState('group-1')
  const session = useAuth()
  const bolao = useBolao(session.user, session.authReady, session.canAccessBolao)
  const isFirebaseMode = bolao.storageMode === 'firebase'

  if (bolao.error) {
    return (
      <div className="app-error">
        <WifiOff size={48} />
        <h2>Erro de conexão com o Firebase</h2>
        <p>{bolao.error}</p>
        <p className="error-hint">
          Verifique se o arquivo <code>.env</code> está configurado corretamente
          com as credenciais do seu projeto Firebase.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isFirebaseMode && (!session.authReady || !session.adminReady || !session.accessReady || (session.canAccessBolao && bolao.loading))) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Conectando ao bolão…</span>
      </div>
    )
  }

  if (isFirebaseMode && !session.user) {
    return (
      <AuthScreen
        onSignIn={session.signIn}
        onSignUp={session.signUp}
        onResetPassword={session.resetPassword}
        pending={session.pending}
      />
    )
  }

  if (isFirebaseMode && session.user && !session.canAccessBolao) {
    return (
      <AccessStatusScreen
        accessStatus={session.accessStatus}
        accessRequest={session.accessRequest}
        onSignOut={session.signOut}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-main">
            <div className="header-title-group">
              <img className="header-logo" src={bffcLogo} alt="Escudo do Bras Foot F.C." />
              <div>
                <h1 className="header-title">BOLÃO BFFC</h1>
                <p className="header-subtitle">Copa do Mundo FIFA 2026</p>
              </div>
            </div>
            {session.user && (
              <div className="session-chip">
                <div>
                  <strong>{bolao.currentPlayer?.name ?? session.user.displayName ?? 'Participante'}</strong>
                  <span>{session.user.email}</span>
                </div>
                {isFirebaseMode && (
                  <button className="btn btn-ghost btn-sm" onClick={session.signOut}>
                    <LogOut size={14} />
                    Sair
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="header-aside">
            <HighlightsCTA
              selectedRound={highlightRound}
              onSelectRound={setHighlightRound}
              onOpen={() => setActiveTab('highlights')}
            />
            <div className="header-stats">
            <>
              <span className="stat">{bolao.players.length} <small>jogadores</small></span>
              <span className="stat">{bolao.results.length} <small>resultados</small></span>
              <span
                className={`online-badge ${isFirebaseMode ? '' : 'local'}`.trim()}
                title={isFirebaseMode ? 'Conectado ao Firebase' : 'Modo local sem Firebase'}
              >
                {isFirebaseMode ? <Wifi size={13} /> : <WifiOff size={13} />}
              </span>
            </>
            </div>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="app-main">
        <>
          {activeTab === 'ranking' && (
            <Ranking
              players={bolao.players}
              bets={bolao.bets}
              results={bolao.results}
                matches={bolao.matches}
            />
          )}
          {activeTab === 'highlights' && (
            <Highlights
              players={bolao.players}
              bets={bolao.bets}
              results={bolao.results}
              matches={bolao.matches}
              selectedRound={highlightRound}
              onRoundChange={setHighlightRound}
            />
          )}
          {activeTab === 'evolution' && (
            <Evolution
              players={bolao.players}
              bets={bolao.bets}
              results={bolao.results}
              matches={bolao.matches}
            />
          )}
          {activeTab === 'bets' && (
            <Bets
              matches={bolao.matches}
              players={bolao.players}
              currentPlayer={bolao.currentPlayer}
              placeBet={bolao.placeBet}
              removeBet={bolao.removeBet}
              getResult={bolao.getResult}
              getOwnBet={bolao.getOwnBet}
              getVisibleBets={bolao.getVisibleBets}
            />
          )}
          {activeTab === 'day-bets' && (
            <DayBets
              matches={bolao.matches}
              currentPlayer={bolao.currentPlayer}
              getResult={bolao.getResult}
              getVisibleBets={bolao.getVisibleBets}
            />
          )}
          {activeTab === 'players' && (
            <Players
              currentUser={session.user}
              currentPlayer={bolao.currentPlayer}
              players={bolao.players}
              saveOwnProfile={bolao.saveOwnProfile}
            />
          )}
          {activeTab === 'rules' && <Rules />}
          {activeTab === 'admin' && (
            <Admin
              currentUser={session.user}
              canManageResults={session.isAdmin}
              adminReady={session.adminReady}
              accessRequests={session.accessRequests}
              reviewAccessRequest={session.reviewAccessRequest}
              deleteRejectedAccessRequest={session.deleteRejectedAccessRequest}
              matches={bolao.matches}
              matchOverrides={bolao.matchOverrides}
              matchSchedule={bolao.matchSchedule}
              results={bolao.results}
              setResult={bolao.setResult}
              removeResult={bolao.removeResult}
              saveMatchOverride={bolao.saveMatchOverride}
              clearMatchOverride={bolao.clearMatchOverride}
              saveMatchSchedule={bolao.saveMatchSchedule}
              clearMatchSchedule={bolao.clearMatchSchedule}
            />
          )}
        </>
      </main>

      <footer className="app-footer">
        <span>🇧🇷 Bolão Copa 2026 • EUA · Canadá · México</span>
      </footer>
    </div>
  )
}
