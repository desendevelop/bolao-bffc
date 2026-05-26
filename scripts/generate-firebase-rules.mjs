import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MATCHES, getBetDeadline } from '../src/data/matches.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.join(projectRoot, 'firebase-rules.json')

function createBetRule(deadlineMs) {
  return {
    '.write': `auth != null && auth.uid === $playerId && now < ${deadlineMs}`,
    '.validate': "newData.hasChildren(['homeGoals', 'awayGoals', 'placedAt'])",
    homeGoals: {
      '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 99',
    },
    awayGoals: {
      '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 99',
    },
    placedAt: {
      '.validate': 'newData.isString()',
    },
    $other: {
      '.validate': false,
    },
  }
}

const betRulesByMatch = Object.fromEntries(
  MATCHES.map(match => {
    const deadlineMs = getBetDeadline(match.date).getTime()
    return [match.id, createBetRule(deadlineMs)]
  })
)

betRulesByMatch.$other = { '.validate': false }

const rules = {
  rules: {
    players: {
      '.read': 'auth != null',
      $playerId: {
        '.write': 'auth != null && auth.uid === $playerId',
        '.validate': "newData.hasChildren(['name', 'email', 'createdAt'])",
        name: {
          '.validate': 'newData.isString() && newData.val().length >= 2 && newData.val().length <= 40',
        },
        email: {
          '.validate': 'newData.isString() && newData.val().length >= 5 && newData.val().length <= 120',
        },
        createdAt: {
          '.validate': 'newData.isString()',
        },
        $other: {
          '.validate': false,
        },
      },
    },
    bets: {
      '.read': 'auth != null',
      $playerId: betRulesByMatch,
    },
    admins: {
      $uid: {
        '.read': 'auth != null && auth.uid === $uid',
        '.write': false,
        '.validate': 'newData.val() === true',
      },
    },
    matchOverrides: {
      '.read': 'auth != null',
      '.write': "auth != null && root.child('admins').child(auth.uid).val() === true",
      $matchId: {
        '.validate': "newData.hasChildren(['home', 'away', 'updatedAt'])",
        home: {
          '.validate': 'newData.isString() && newData.val().length >= 2 && newData.val().length <= 60',
        },
        away: {
          '.validate': 'newData.isString() && newData.val().length >= 2 && newData.val().length <= 60',
        },
        updatedAt: {
          '.validate': 'newData.isString()',
        },
        $other: {
          '.validate': false,
        },
      },
    },
    results: {
      '.read': 'auth != null',
      '.write': "auth != null && root.child('admins').child(auth.uid).val() === true",
      $matchId: {
        '.validate': "newData.hasChildren(['homeGoals', 'awayGoals', 'setAt']) && (!newData.child('winnerSide').exists() || newData.child('winnerSide').val() === 'home' || newData.child('winnerSide').val() === 'away')",
        homeGoals: {
          '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 99',
        },
        awayGoals: {
          '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 99',
        },
        setAt: {
          '.validate': 'newData.isString()',
        },
        winnerSide: {
          '.validate': "newData.val() === 'home' || newData.val() === 'away'",
        },
        $other: {
          '.validate': false,
        },
      },
    },
  },
}

fs.writeFileSync(outputPath, `${JSON.stringify(rules, null, 2)}\n`, 'utf8')
console.log(`firebase-rules.json atualizado com ${MATCHES.length} deadlines.`)
