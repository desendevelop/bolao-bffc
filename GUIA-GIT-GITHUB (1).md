# Guia: Versionando o Bolão Copa 2026 no GitHub

---

## Pré-requisitos

- Git instalado na máquina (`git --version` pra confirmar)
- Conta no GitHub (github.com)
- Node.js 18+ instalado (`node --version`)

---

## 1. Extrair e preparar o projeto

```bash
# Extrair o arquivo .tar.gz
tar -xzf bolao-copa-2026-v2.tar.gz

# Entrar na pasta
cd bolao-copa-2026

# Instalar dependências
npm install
```

---

## 2. Configurar o arquivo .env (credenciais Firebase)

```bash
# Copiar o template de variáveis de ambiente
cp .env.example .env
```

Abra o `.env` num editor de texto e preencha com as credenciais do seu projeto
Firebase. Veja o README.md para instruções de como obtê-las.

> ⚠️ IMPORTANTE: o arquivo `.env` já está no `.gitignore` e NUNCA deve ser
> commitado. Ele contém suas chaves privadas do Firebase.

---

## 3. Confirmar que o projeto está funcionando localmente

```bash
npm run dev
```

Acesse http://localhost:5173 e confira que a aplicação carrega sem erros.
Pressione Ctrl+C para parar o servidor.

---

## 4. Inicializar o repositório Git

```bash
# Inicializa o git na pasta do projeto
git init

# Confere o que será commitado — .env NÃO deve aparecer nessa lista
git status
```

A saída do `git status` deve listar arquivos como `src/`, `package.json`,
`README.md`, `.env.example`, `firebase-rules.json`, etc.
Se o arquivo `.env` aparecer, pare aqui e revise o `.gitignore`.

```bash
# Adiciona todos os arquivos ao staging
git add .

# Cria o primeiro commit
git commit -m "feat: bolão copa 2026 com Firebase Realtime Database"
```

---

## 5. Criar o repositório no GitHub

1. Acesse https://github.com/new
2. Preencha:
   - **Repository name:** `bolao-copa-2026`
   - **Visibility:** Private (recomendado — evita expor a URL do Firebase)
   - **NÃO marque** nenhuma opção de inicializar com README, .gitignore ou licença
     (o projeto já tem tudo isso)
3. Clique em **Create repository**

---

## 6. Conectar o repositório local ao GitHub e fazer o push

O GitHub vai mostrar esses comandos após criar o repositório, mas já estão
aqui para referência — substitua SEU_USUARIO pelo seu usuário do GitHub:

```bash
git remote add origin https://github.com/SEU_USUARIO/bolao-copa-2026.git
git branch -M main
git push -u origin main
```

Pronto. O código está no GitHub.

---

## 7. Compartilhar com colaboradores

Compartilhe o link do repositório com quem for contribuir com o código.
Para dar acesso a um repositório privado:
  GitHub → Settings → Collaborators → Add people

Quem clonar o projeto precisa fazer:

```bash
git clone https://github.com/SEU_USUARIO/bolao-copa-2026.git
cd bolao-copa-2026
npm install
cp .env.example .env    # preencher com as credenciais do Firebase
npm run dev
```

---

## Workflow do dia a dia

### Fazer uma alteração e commitar

```bash
# Ver o que mudou
git status
git diff

# Adicionar as mudanças ao staging
git add .

# Commitar com uma mensagem descritiva
git commit -m "fix: corrige cálculo de pontos nas oitavas"

# Enviar para o GitHub
git push
```

### Criar uma branch para uma nova funcionalidade

```bash
# Cria e já muda para a nova branch
git checkout -b feat/nome-da-feature

# ... faz as alterações, commits ...

# Sobe a branch para o GitHub
git push -u origin feat/nome-da-feature

# No GitHub, abre um Pull Request de feat/nome-da-feature → main
```

### Puxar atualizações que outra pessoa fez

```bash
git pull
```

---

## Convenção de mensagens de commit (recomendação)

Usar prefixos padronizados facilita entender o histórico:

| Prefixo  | Quando usar                                      |
|----------|--------------------------------------------------|
| feat:    | nova funcionalidade                              |
| fix:     | correção de bug                                  |
| chore:   | tarefas de manutenção (deps, configs)            |
| docs:    | alterações em documentação                       |
| style:   | mudanças de CSS / formatação sem impacto lógico  |
| refactor:| refatoração sem nova feature nem correção de bug |
| data:    | atualização dos dados de jogos/resultados        |

Exemplos:
```
feat: adiciona histórico de palpites por jogador
fix: bloqueia palpite quando deadline já passou
data: atualiza confrontos das oitavas de final
chore: atualiza dependência do Firebase para 12.14.0
```

---

## Atualizar os confrontos da fase eliminatória

Quando a FIFA confirmar os confrontos do mata-mata, edite o arquivo
`src/data/matches.js` e substitua "A definir" pelos nomes das seleções:

```js
// Antes
{ id: 'R01', ..., home: 'A definir', away: 'A definir', ... },

// Depois
{ id: 'R01', ..., home: 'Brasil', away: 'Argentina', ... },
```

Depois commite e suba:

```bash
git add src/data/matches.js
git commit -m "data: atualiza confrontos da rodada de 32"
git push
```

---

## Resolver conflito de merge (caso aconteça)

Se duas pessoas editarem o mesmo arquivo ao mesmo tempo:

```bash
# Git vai marcar os conflitos no arquivo com <<<<, ==== e >>>>
# Abra o arquivo, escolha qual versão manter e salve

git add arquivo-com-conflito.js
git commit -m "fix: resolve conflito em matches.js"
git push
```

---

## Checklist antes de cada push

- [ ] `git status` — nenhum arquivo sensível (`.env`) está no staging
- [ ] O projeto compila sem erros: `npm run build`
- [ ] A mensagem do commit é descritiva e usa a convenção de prefixos
