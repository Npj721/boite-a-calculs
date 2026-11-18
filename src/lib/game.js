export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#E8A0BF', '#95E1D3', '#F38181']

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function digitRange(digits) {
  const d = clampInt(digits, 1, 4, 1)
  if (d <= 1) return [1, 9]
  const min = 10 ** (d - 1)
  const max = 10 ** d - 1
  return [min, max]
}

export function randDigits(digits) {
  const [min, max] = digitRange(digits)
  return rand(min, max)
}

function digitsFromMax(max) {
  const n = Math.max(1, Math.abs(Number(max) || 1))
  return clampInt(String(Math.floor(n)).length, 1, 4, 1)
}

function normalizeOpConfig(op, raw) {
  const base = DEFAULT_CONFIG[op]
  if (!raw || typeof raw !== 'object') return { ...base }

  if ('aDigits' in raw || 'bDigits' in raw) {
    return {
      aDigits: clampInt(raw.aDigits, 1, 4, base.aDigits),
      bDigits: clampInt(raw.bDigits, 1, 4, base.bDigits)
    }
  }

  // Migration depuis l'ancien format (min/max)
  if (op === '÷') {
    const aDigits = raw.dividendMax != null
      ? digitsFromMax(raw.dividendMax)
      : Math.max(digitsFromMax(raw.divisorMax), digitsFromMax(raw.answerMax))
    const bDigits = digitsFromMax(raw.divisorMax ?? raw.divisorMin)
    return {
      aDigits: clampInt(aDigits, 1, 4, base.aDigits),
      bDigits: clampInt(bDigits, 1, 4, base.bDigits)
    }
  }

  return {
    aDigits: clampInt(digitsFromMax(raw.aMax ?? raw.aMin), 1, 4, base.aDigits),
    bDigits: clampInt(digitsFromMax(raw.bMax ?? raw.bMin), 1, 4, base.bDigits)
  }
}

export const DEFAULT_CONFIG = {
  '+': { aDigits: 2, bDigits: 2 },
  '-': { aDigits: 2, bDigits: 2 },
  '×': { aDigits: 1, bDigits: 1 },
  '÷': { aDigits: 2, bDigits: 1 }
}

export const DIFFICULTY_PRESETS = {
  easy: {
    label: 'Facile',
    icon: '🌱',
    description: 'Petits nombres (1 chiffre)',
    opOptions: { '+': true, '-': true, '×': true, '÷': true },
    config: {
      '+': { aDigits: 1, bDigits: 1 },
      '-': { aDigits: 1, bDigits: 1 },
      '×': { aDigits: 1, bDigits: 1 },
      '÷': { aDigits: 2, bDigits: 1 }
    }
  },
  medium: {
    label: 'Moyen',
    icon: '⚖️',
    description: 'Nombres à 2 chiffres',
    opOptions: { '+': true, '-': true, '×': true, '÷': true },
    config: clone(DEFAULT_CONFIG)
  },
  hard: {
    label: 'Difficile',
    icon: '🔥',
    description: 'Grands nombres (2 à 3 chiffres)',
    opOptions: { '+': true, '-': true, '×': true, '÷': true },
    config: {
      '+': { aDigits: 3, bDigits: 2 },
      '-': { aDigits: 3, bDigits: 2 },
      '×': { aDigits: 2, bDigits: 1 },
      '÷': { aDigits: 3, bDigits: 1 }
    }
  }
}

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'custom']

export function defaultSettings() {
  return {
    gameMode: 'normal',
    mode: 'flip',
    difficulty: 'custom',
    duration: 120,
    maxTimePerCalc: 30,
    opOptions: { '+': true, '-': true, '×': true, '÷': true },
    config: clone(DEFAULT_CONFIG),
    tableOps: { '×': true, '÷': true },
    selectedTables: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true]))
  }
}

export function normalizeSettings(raw) {
  const base = defaultSettings()
  if (!raw || typeof raw !== 'object') return base

  const gameMode = raw.gameMode === 'table' || raw.gameMode === 'mix' ? raw.gameMode : 'normal'

  const settings = {
    ...base,
    ...raw,
    gameMode,
    mode: raw.mode === 'input' ? 'input' : 'flip',
    difficulty: DIFFICULTY_LEVELS.includes(raw.difficulty) ? raw.difficulty : 'custom',
    duration: clampInt(raw.duration, 10, 600, base.duration),
    maxTimePerCalc: clampInt(raw.maxTimePerCalc, 5, 120, base.maxTimePerCalc),
    opOptions: { ...base.opOptions, ...(raw.opOptions || {}) },
    tableOps: { ...base.tableOps, ...(raw.tableOps || {}) },
    selectedTables: { ...base.selectedTables, ...(raw.selectedTables || {}) },
    config: {}
  }

  for (const op of Object.keys(base.config)) {
    settings.config[op] = normalizeOpConfig(op, raw.config && raw.config[op])
  }

  return settings
}

function hasNormalOps(settings) {
  return Object.values(settings.opOptions || {}).some(Boolean)
}

function hasTableSelection(settings) {
  return Object.values(settings.tableOps || {}).some(Boolean) &&
    Object.values(settings.selectedTables || {}).some(Boolean)
}

export function isSettingsPlayable(settings) {
  if (!settings) return false
  if (settings.gameMode === 'table') return hasTableSelection(settings)
  if (settings.gameMode === 'mix') return hasNormalOps(settings) && hasTableSelection(settings)
  return hasNormalOps(settings)
}

const MAX_DUPLICATE_RETRIES = 80

function createPaper(settings) {
  const ops = Object.keys(settings.opOptions).filter(op => settings.opOptions[op])
  if (ops.length === 0) return null

  const op = ops[rand(0, ops.length - 1)]
  const cfg = settings.config
  let a, b, answer

  switch (op) {
    case '+': {
      const c = cfg['+']
      a = randDigits(c.aDigits)
      b = randDigits(c.bDigits)
      answer = a + b
      break
    }
    case '-': {
      const c = cfg['-']
      b = randDigits(c.bDigits)
      const [aMin, aMax] = digitRange(c.aDigits)
      const minA = Math.max(aMin, b)
      a = minA <= aMax ? rand(minA, aMax) : b
      answer = a - b
      break
    }
    case '×': {
      const c = cfg['×']
      a = randDigits(c.aDigits)
      b = randDigits(c.bDigits)
      answer = a * b
      break
    }
    case '÷': {
      const c = cfg['÷']
      const [aMin, aMax] = digitRange(c.aDigits)
      for (let attempt = 0; attempt < 40; attempt++) {
        b = randDigits(c.bDigits)
        if (b === 0) continue
        const kMin = Math.ceil(aMin / b)
        const kMax = Math.floor(aMax / b)
        if (kMin <= kMax) {
          answer = rand(kMin, kMax)
          a = b * answer
          break
        }
      }
      if (a == null) {
        b = randDigits(c.bDigits) || 1
        a = b
        answer = 1
      }
      break
    }
  }

  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: `${a} ${op} ${b}`,
    answer,
    op,
    color: COLORS[rand(0, COLORS.length - 1)]
  }
}

function generatePaper(settings, used) {
  if (!used) return createPaper(settings)

  for (let attempt = 0; attempt < MAX_DUPLICATE_RETRIES; attempt++) {
    const paper = createPaper(settings)
    if (!paper) return null
    if (!used.has(paper.question)) return paper
  }
  return null
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rand(0, i)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function generatePapers(settings) {
  const used = new Set()

  if (settings.gameMode === 'table') return generateTablePapers(settings, 30, used)

  if (settings.gameMode === 'mix') {
    const tablePapers = generateTablePapers(settings, 15, used)
    const normalPapers = generateNormalPapers(settings, Math.max(0, 30 - tablePapers.length), used)
    if (tablePapers.length === 0) return normalPapers
    if (normalPapers.length === 0) return tablePapers
    return shuffle([...normalPapers, ...tablePapers])
  }

  return generateNormalPapers(settings, 30, used)
}

function generateNormalPapers(settings, count, used = new Set()) {
  const papers = []
  for (let i = 0; i < count; i++) {
    const paper = generatePaper(settings, used)
    if (!paper) break
    used.add(paper.question)
    papers.push(paper)
  }
  return papers
}

function generateTablePapers(settings, limit, used = new Set()) {
  const activeOps = Object.entries(settings.tableOps).filter(([, active]) => active).map(([op]) => op)
  const activeTables = Object.entries(settings.selectedTables)
    .filter(([, active]) => active)
    .map(([n]) => parseInt(n, 10))

  if (activeOps.length === 0 || activeTables.length === 0) return []

  const all = []
  for (const table of activeTables) {
    for (let a = 1; a <= 9; a++) {
      for (const op of activeOps) {
        if (op === '×') {
          all.push({ question: `${a} × ${table}`, answer: a * table, op })
        } else {
          all.push({ question: `${a * table} ÷ ${table}`, answer: a, op })
        }
      }
    }
  }

  shuffle(all)

  const selected = []
  for (const paper of all) {
    if (used.has(paper.question)) continue
    used.add(paper.question)
    selected.push(paper)
    if (selected.length >= limit) break
  }

  return selected.map((paper, i) => ({
    id: `p-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    ...paper,
    color: COLORS[rand(0, COLORS.length - 1)]
  }))
}

export function createGame(settings) {
  const normalized = normalizeSettings(settings)
  return {
    id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    gameMode: normalized.gameMode,
    mode: normalized.mode,
    duration: normalized.duration,
    maxTimePerCalc: normalized.maxTimePerCalc,
    opOptions: clone(normalized.opOptions),
    config: clone(normalized.config),
    tableOps: clone(normalized.tableOps),
    selectedTables: clone(normalized.selectedTables),
    papers: generatePapers(normalized),
    currentPaper: null,
    phase: 'box',
    answerLocked: false,
    streak: 0,
    total: 0,
    correct: 0,
    history: [],
    timeRemaining: normalized.duration,
    calcTimeLeft: normalized.maxTimePerCalc,
    status: 'playing',
    finishReason: null
  }
}

function uniquePapers(papers) {
  const seen = new Set()
  return papers.filter(paper => {
    if (!paper || typeof paper.question !== 'string' || !Number.isFinite(paper.answer)) return false
    if (seen.has(paper.question)) return false
    seen.add(paper.question)
    return true
  })
}

export function normalizeGame(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.papers)) return null

  const duration = clampInt(raw.duration, 10, 600, 120)
  const maxTimePerCalc = clampInt(raw.maxTimePerCalc, 5, 120, 30)

  return {
    ...raw,
    id: typeof raw.id === 'string' ? raw.id : `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    gameMode: raw.gameMode === 'table' || raw.gameMode === 'mix' ? raw.gameMode : 'normal',
    mode: raw.mode === 'input' ? 'input' : 'flip',
    duration,
    maxTimePerCalc,
    papers: uniquePapers(raw.papers),
    history: Array.isArray(raw.history) ? raw.history : [],
    answerLocked: Boolean(raw.answerLocked),
    streak: Number.isFinite(raw.streak) ? raw.streak : 0,
    total: Number.isFinite(raw.total) ? raw.total : 0,
    correct: Number.isFinite(raw.correct) ? raw.correct : 0,
    timeRemaining: Number.isFinite(raw.timeRemaining) ? raw.timeRemaining : duration,
    calcTimeLeft: Number.isFinite(raw.calcTimeLeft) ? raw.calcTimeLeft : maxTimePerCalc,
    status: 'playing',
    finishReason: null
  }
}

export function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
