# 🏆 Bolão Copa do Mundo FIFA 2026

Plataforma web para gerenciar palpites da Copa do Mundo 2026 entre amigos.  
Dados sincronizados em tempo real via **Firebase Realtime Database** — todos os participantes veem o ranking atualizado instantaneamente.

## Funcionalidades

- 📋 Registro de palpites por jogador, com placar livre
- ⏰ Deadline automático: palpites bloqueados 2h antes de cada partida
- 🏅 Ranking em tempo real com pontuação atualizada conforme resultados
- 📈 Multiplicadores por fase: pontos valem mais nas fases finais
- 🔐 Login por e-mail e senha para cada participante editar apenas os próprios palpites
- 🛡️ Painel Admin protegido por permissão real no Firebase
- 🔄 Chave do mata-mata atualizada automaticamente conforme os resultados oficiais
- 📖 Regras explicadas na própria plataforma
- ☁️ Sincronização em tempo real para todos os participantes

## Stack

- **React 18** + Vite
- **Firebase Realtime Database** (sincronização em tempo real)
- Vanilla CSS
- Lucide React (ícones)

---

## Setup

### 1. Clone e instale as dependências

```bash
git clone https://github.com/seu-usuario/bolao-copa-2026.git
cd bolao-copa-2026
npm install
```

### 2. Crie o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** → dê um nome (ex: `bolao-copa-2026`)
3. Desative o Google Analytics (não precisa para esse projeto) → **Criar projeto**

### 3. Crie o Realtime Database

1. No menu lateral, vá em **Realtime Database** → **Criar banco de dados**
2. Escolha a região **us-central1** (ou a mais próxima disponível)
3. Inicie no **modo de teste** (vamos configurar as regras manualmente depois)

### 4. Registre o app Web

1. Na página inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido ao app (ex: `bolao-web`) → **Registrar app**
3. Copie o objeto `firebaseConfig` que aparecer

### 4.1. Habilite login por e-mail e senha

1. No Firebase Console, vá em **Authentication** → **Get started**
2. Na aba **Sign-in method**, habilite **Email/Password**
3. Salve a configuração

### 5. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os valores do `firebaseConfig` que você copiou:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ O `.env` já está no `.gitignore`. Nunca commite esse arquivo.

### 6. Configure as regras de segurança do banco

1. No Firebase Console → **Realtime Database** → aba **Regras**
2. Substitua o conteúdo pelo arquivo `firebase-rules.json` deste repositório
3. Clique em **Publicar**

> Se você alterar datas/horários em `src/data/matches.js`, regenere as regras antes de publicar:
>
> ```bash
> npm run rules:generate
> ```

### 6.1. Defina a conta admin

Depois de criar a conta que será administradora dentro do app:

1. Copie o `uid` dessa conta
2. No Realtime Database, crie o caminho:

```json
{
  "admins": {
    "SEU_UID_AQUI": true
  }
}
```

Essa conta será a única autorizada a lançar resultados.

### 7. Rode localmente

```bash
npm run dev
```

Acesse em `http://localhost:5173`

---

## Deploy (Netlify — recomendado)

```bash
npm run build
```

1. Acesse [netlify.com](https://netlify.com) → **Add new site** → **Deploy manually**
2. Arraste a pasta `dist/` para o Netlify
3. Vá em **Site settings** → **Environment variables** → adicione todas as variáveis do `.env`
4. Faça um novo deploy (ou use **Redeploy**)

Alternativamente, conecte o repositório GitHub ao Netlify para deploy automático a cada push.

---

## Sistema de pontuação

### Regras base

| Situação | Pontos |
|---|:---:|
| Errou o vencedor **E** o placar | 0 |
| Acertou o vencedor, errou o placar | 1 |
| Acertou vencedor + gols de 1 dos times | 2 |
| Acertou vencedor + placar exato 🎯 | 5 |
| Acertou empate, errou o placar | 2 |
| Acertou empate + placar exato 🎯 | 5 |
| Sem palpite | 0 |

### Multiplicadores por fase

| Fase | Mult. | Pts máx. (placar exato) |
|---|:---:|:---:|
| Fase de Grupos | 1× | 5 |
| Rodada de 32 | 1.5× | 8 |
| Oitavas de Final | 2× | 10 |
| Quartas de Final | 3× | 15 |
| Semifinal | 4× | 20 |
| Disputa pelo 3º Lugar | 4× | 20 |
| Final | 5× | 25 |

> Pontos finais são arredondados para cima (`Math.ceil`).

---

## Painel Admin

O painel Admin agora depende da permissão em `/admins/{uid}` no Realtime Database. O acesso não é mais controlado só pela interface.

Nos jogos de mata-mata, se a partida terminar empatada no placar informado, o admin deve indicar quem avançou para que a próxima fase seja preenchida automaticamente.
Se houver algum caso excepcional no chaveamento, o admin também pode sobrescrever manualmente os times de um confronto do mata-mata e depois limpar esse ajuste quando não for mais necessário.

---

## Estrutura do projeto

```
bolao-copa-2026/
├── .env.example              ← modelo das variáveis de ambiente
├── .gitignore
├── firebase-rules.json       ← regras de segurança do Realtime Database
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── services/
    │   └── firebase.js       ← inicialização do Firebase SDK
    ├── data/
    │   └── matches.js        ← 104 jogos + config de fases e multiplicadores
    ├── utils/
    │   └── scoring.js        ← lógica de pontuação e ranking
    ├── hooks/
    │   └── useBolao.js       ← estado global + sync Firebase (listeners em tempo real)
    ├── components/
    │   ├── Ranking.jsx
    │   ├── Bets.jsx
    │   ├── Players.jsx
    │   ├── Rules.jsx
    │   └── Admin.jsx
    ├── App.jsx
    ├── styles.css
    └── main.jsx
```

---

## Observações

- A fase eliminatória tem confrontos como "A definir". Quando a FIFA confirmar, atualize `home` e `away` em `src/data/matches.js`.
- Cada participante precisa criar sua própria conta com e-mail e senha antes de palpitar.
- As regras do banco impedem que um usuário altere palpites de outro.
- O prazo de palpite também é validado nas regras do Firebase, não só na interface.
- O plano gratuito (Spark) do Firebase suporta 1 GB de armazenamento e 10 GB/mês de transferência — mais do que suficiente para um bolão.
