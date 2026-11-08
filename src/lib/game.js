export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#E8A0BF', '#95E1D3', '#F38181']

export const DEFAULT_CONFIG = {
  '+': { aMin: 1, aMax: 50, bMin: 1, bMax: 50 },
  '-': { aMin: 2, aMax: 99, bMin: 1, bMax: 50 },
  '×': { aMin: 2, aMax: 9, bMin: 2, bMax: 9 },
  '÷': { divisorMin: 2, divisorMax: 9, answerMin: 1, answerMax: 12, dividendMax: 81 }
}

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

export function defaultSettings() {
  return {
    gameMode: 'normal',
    mode: 'flip',
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
    duration: clampInt(raw.duration, 10, 600, base.duration),
    maxTimePerCalc: clampInt(raw.maxTimePerCalc, 5, 120, base.maxTimePerCalc),
    opOptions: { ...base.opOptions, ...(raw.opOptions || {}) },
    tableOps: { ...base.tableOps, ...(raw.tableOps || {}) },
    selectedTables: { ...base.selectedTables, ...(raw.selectedTables || {}) },
    config: {}
  }

  for (const op of Object.keys(base.config)) {
    settings.config[op] = { ...base.config[op], ...((raw.config && raw.config[op]) || {}) }
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

function generatePaper(settings) {
  const ops = Object.keys(settings.opOptions).filter(op => settings.opOptions[op])
  if (ops.length === 0) return null

  const op = ops[rand(0, ops.length - 1)]
  const cfg = settings.config
  let a, b, answer

  switch (op) {
    case '+': {
      const c = cfg['+']
      a = rand(c.aMin, c.aMax)
      b = rand(c.bMin, Math.min(c.bMax, c.aMax + c.bMax - a))
      answer = a + b
      break
    }
    case '-': {
      const c = cfg['-']
      b = rand(c.bMin, c.bMax)
      a = rand(Math.max(c.aMin, b + 1), c.aMax)
      answer = a - b
      break
    }
    case '×': {
      const c = cfg['×']
      a = rand(c.aMin, c.aMax)
      b = rand(c.bMin, c.bMax)
      answer = a * b
      break
    }
    case '÷': {
      const c = cfg['÷']
      b = rand(c.divisorMin, c.divisorMax)
      const maxAnswer = Math.min(c.answerMax, Math.floor(c.dividendMax / b))
      answer = rand(c.answerMin, Math.max(c.answerMin, maxAnswer))
      a = b * answer
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

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rand(0, i)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function generatePapers(settings) {
  if (settings.gameMode === 'table') return generateTablePapers(settings, 30)

  if (settings.gameMode === 'mix') {
    const tablePapers = generateTablePapers(settings, 15)
    const normalPapers = generateNormalPapers(settings, Math.max(0, 30 - tablePapers.length))
    if (tablePapers.length === 0) return normalPapers
    if (normalPapers.length === 0) return tablePapers
    return shuffle([...normalPapers, ...tablePapers])
  }

  return generateNormalPapers(settings, 30)
}

function generateNormalPapers(settings, count) {
  const papers = []
  for (let i = 0; i < count; i++) {
    const paper = generatePaper(settings)
    if (paper) papers.push(paper)
  }
  return papers
}

function generateTablePapers(settings, limit) {
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

  return all.slice(0, limit).map((paper, i) => ({
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
    papers: raw.papers.filter(p => p && typeof p.question === 'string' && Number.isFinite(p.answer)),
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
