import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MATCHES, getBetDeadline } from '../src/data/matches.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.join(projectRoot, 'firebase-rules.json')
const isAdminExpr = "auth != null && root.child('admins').child(auth.uid).val() === true"
const isApprovedExpr = "auth != null && (root.child('admins').child(auth.uid).val() === true || root.child('accessRequests').child(auth.uid).child('status').val() === 'approved' || (!root.child('accessRequests').child(auth.uid).exists() && root.child('players').child(auth.uid).exists()))"

function createDeadlineExpr(matchId, defaultDeadlineMs) {
  const deadlineRef = `root.child('matchSchedule').child('${matchId}').child('deadlineMs')`
  return `(${deadlineRef}.exists() ? ${deadlineRef}.val() : ${defaultDeadlineMs})`
}

function createBetRule(matchId, defaultDeadlineMs) {
  const deadlineExpr = createDeadlineExpr(matchId, defaultDeadlineMs)
  return {
    '.read': `auth != null && (auth.uid === $playerId || now >= ${deadlineExpr})`,
    '.write': `${isApprovedExpr} && auth.uid === $playerId && now < ${deadlineExpr}`,
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
    return [match.id, createBetRule(match.id, deadlineMs)]
  })
)

betRulesByMatch.$other = { '.validate': false }

const rules = {
  rules: {
    players: {
      '.read': isApprovedExpr,
      $playerId: {
        '.write': `${isAdminExpr} || (${isApprovedExpr} && auth.uid === $playerId)`,
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
    accessRequests: {
      '.read': isAdminExpr,
      $uid: {
        '.read': `auth != null && (auth.uid === $uid || (${isAdminExpr}))`,
        '.write': `auth != null && ((${isAdminExpr}) || (auth.uid === $uid && !data.exists() && newData.child('status').val() === 'pending'))`,
        '.validate': "newData.hasChildren(['name', 'email', 'status', 'requestedAt']) && newData.child('name').isString() && newData.child('name').val().length >= 2 && newData.child('name').val().length <= 40 && newData.child('email').isString() && newData.child('email').val().length >= 5 && newData.child('email').val().length <= 120 && (newData.child('status').val() === 'pending' || newData.child('status').val() === 'approved' || newData.child('status').val() === 'rejected') && newData.child('requestedAt').isString() && (!newData.child('reviewedAt').exists() || newData.child('reviewedAt').isString()) && (!newData.child('reviewedBy').exists() || newData.child('reviewedBy').isString())",
        name: {
          '.validate': 'newData.isString() && newData.val().length >= 2 && newData.val().length <= 40',
        },
        email: {
          '.validate': 'newData.isString() && newData.val().length >= 5 && newData.val().length <= 120',
        },
        status: {
          '.validate': "newData.val() === 'pending' || newData.val() === 'approved' || newData.val() === 'rejected'",
        },
        requestedAt: {
          '.validate': 'newData.isString()',
        },
        reviewedAt: {
          '.validate': 'newData.isString()',
        },
        reviewedBy: {
          '.validate': 'newData.isString() && newData.val().length > 0',
        },
        $other: {
          '.validate': false,
        },
      },
    },
    bets: {
      $playerId: {
        '.write': isAdminExpr,
        '.read': 'auth != null && auth.uid === $playerId',
        ...betRulesByMatch,
      },
    },
    admins: {
      $uid: {
        '.read': 'auth != null && auth.uid === $uid',
        '.write': false,
        '.validate': 'newData.val() === true',
      },
    },
    matchOverrides: {
      '.read': isApprovedExpr,
      '.write': isAdminExpr,
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
    matchSchedule: {
      '.read': isApprovedExpr,
      '.write': isAdminExpr,
      $matchId: {
        '.validate': "newData.hasChildren(['date', 'deadlineMs', 'updatedAt'])",
        date: {
          '.validate': 'newData.isString() && newData.val().length >= 16 && newData.val().length <= 40',
        },
        deadlineMs: {
          '.validate': 'newData.isNumber() && newData.val() > 0',
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
      '.read': isApprovedExpr,
      '.write': isAdminExpr,
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
