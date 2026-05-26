import { useState } from 'react'
import { Trophy, Users, ClipboardList, BookOpen, Shield, Wifi, WifiOff } from 'lucide-react'
import { useBolao } from './hooks/useBolao.js'
import { Ranking }  from './components/Ranking.jsx'
import { Players }  from './components/Players.jsx'
import { Bets }     from './components/Bets.jsx'
import { Rules }    from './components/Rules.jsx'
import { Admin }    from './components/Admin.jsx'
import './styles.css'

const TABS = [
  { id: 'ranking',  label: 'Ranking',   icon: Trophy },
  { id: 'bets',     label: 'Palpites',  icon: ClipboardList },
  { id: 'players',  label: 'Jogadores', icon: Users },
  { id: 'rules',    label: 'Regras',    icon: BookOpen },
  { id: 'admin',    label: 'Admin',     icon: Shield },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('ranking')
  const bolao = useBolao()
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title-group">
            <span className="header-flag">🏆</span>
            <div>
              <h1 className="header-title">BOLÃO</h1>
              <p className="header-subtitle">Copa do Mundo FIFA 2026</p>
            </div>
          </div>
          <div className="header-stats">
            {bolao.loading ? (
              <span className="stat loading-pulse">Conectando…</span>
            ) : (
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
            )}
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
        {bolao.loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <span>Carregando dados…</span>
          </div>
        ) : (
          <>
            {activeTab === 'ranking' && (
              <Ranking
                players={bolao.players}
                bets={bolao.bets}
                results={bolao.results}
              />
            )}
            {activeTab === 'bets' && (
              <Bets
                players={bolao.players}
                bets={bolao.bets}
                results={bolao.results}
                placeBet={bolao.placeBet}
                getResult={bolao.getResult}
                getBet={bolao.getBet}
              />
            )}
            {activeTab === 'players' && (
              <Players
                players={bolao.players}
                addPlayer={bolao.addPlayer}
                removePlayer={bolao.removePlayer}
              />
            )}
            {activeTab === 'rules' && <Rules />}
            {activeTab === 'admin' && (
              <Admin
                results={bolao.results}
                setResult={bolao.setResult}
                removeResult={bolao.removeResult}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>🇧🇷 Bolão Copa 2026 • EUA · Canadá · México</span>
      </footer>
    </div>
  )
}
