<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import SettingsPanel from './SettingsPanel.vue'
import GameBox from './GameBox.vue'
import PaperCard from './PaperCard.vue'
import ResultsScreen from './ResultsScreen.vue'
import ReviewStage from './ReviewStage.vue'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({
      '+': { aMin: 1, aMax: 50, bMin: 1, bMax: 50 },
      '-': { aMin: 2, aMax: 99, bMin: 1, bMax: 50 },
      '×': { aMin: 2, aMax: 9, bMin: 2, bMax: 9 },
      '÷': { divisorMin: 2, divisorMax: 9, answerMin: 1, answerMax: 12, dividendMax: 81 }
    })
  },
  maxTimePerCalc: { type: Number, default: 30 }
})

const gameMode = ref('normal')
const selectedTables = ref(Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true])))
const tableOps = ref({ '×': true, '÷': true })

const opOptions = ref({
  '+': true,
  '-': true,
  '×': true,
  '÷': true
})

const activeOps = computed(() => Object.keys(opOptions.value).filter(k => opOptions.value[k]))
const showSettings = ref(false)
const settingsDirty = ref(false)
const localConfig = ref(JSON.parse(JSON.stringify(props.config)))
const localMaxTime = ref(props.maxTimePerCalc)
const calcTimeLeft = ref(props.maxTimePerCalc)
const calcInterval = ref(null)

const calcPercent = computed(() => (calcTimeLeft.value / localMaxTime.value) * 100)
const calcUrgent = computed(() => calcTimeLeft.value <= 10)

watch(localConfig, () => { settingsDirty.value = true }, { deep: true })
watch(localMaxTime, () => { settingsDirty.value = true })
watch(gameMode, () => { settingsDirty.value = true })
watch(selectedTables, () => { settingsDirty.value = true }, { deep: true })
watch(tableOps, () => { settingsDirty.value = true }, { deep: true })

function toggleSettings() {
  showSettings.value = !showSettings.value
  if (!showSettings.value && settingsDirty.value) {
    regeneratePapers()
    settingsDirty.value = false
  }
}

function handleToggleOp(op) {
  opOptions.value[op] = !opOptions.value[op]
}

function handleUpdateConfig({ op, key, val }) {
  localConfig.value[op][key] = val
}



function resetConfig() {
  localConfig.value = JSON.parse(JSON.stringify(props.config))
  localMaxTime.value = props.maxTimePerCalc
  gameMode.value = 'normal'
  selectedTables.value = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true]))
  tableOps.value = { '×': true, '÷': true }
  settingsDirty.value = true
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePaper(id) {
  const ops = activeOps.value
  const op = ops[rand(0, ops.length - 1)]
  const cfg = localConfig.value
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

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#E8A0BF', '#95E1D3', '#F38181']

  return { id, question: `${a} ${op} ${b}`, answer, op, color: colors[rand(0, colors.length - 1)] }
}

function regeneratePapers() {
  if (gameMode.value === 'table') {
    const activeOps = Object.entries(tableOps.value).filter(([_, v]) => v).map(([op]) => op)
    const activeTables = Object.entries(selectedTables.value).filter(([_, v]) => v).map(([n]) => parseInt(n))
    if (activeOps.length === 0 || activeTables.length === 0) { papers.value = []; return }

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#E8A0BF', '#95E1D3', '#F38181']
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

    for (let i = all.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [all[i], all[j]] = [all[j], all[i]]
    }

    papers.value = all.slice(0, 30).map((p, i) => ({
      id: i + Date.now(),
      ...p,
      color: colors[rand(0, colors.length - 1)]
    }))
  } else {
    papers.value = Array.from({ length: 30 }, (_, i) => generatePaper(i + Date.now()))
  }

  if (phase.value === 'empty' || phase.value === 'box') {
    currentPaper.value = null
    phase.value = 'box'
  }
}

watch(activeOps, () => {
  if (activeOps.value.length === 0) return
  regeneratePapers()
})

const papers = ref(Array.from({ length: 30 }, (_, i) => generatePaper(i)))
const currentPaper = ref(null)
const phase = ref('box')
const streak = ref(0)
const total = ref(0)
const correct = ref(0)
const showConfetti = ref(false)
const feedback = ref('')
const mode = ref('flip')
const userAnswer = ref('')
const showError = ref(false)
const answerCorrect = ref(null)

const remaining = computed(() => papers.value.length)

const message = computed(() => {
  if (phase.value === 'empty') return 'Plus de papiers !'
  if (remaining.value <= 5) return 'Plus que quelques papiers !'
  return ''
})

const emoji = computed(() => {
  if (streak.value >= 5) return '🔥'
  if (streak.value >= 3) return '⭐'
  if (streak.value >= 1) return '👏'
  return ''
})

const noOpSelected = computed(() => {
  if (gameMode.value === 'table') return Object.values(tableOps.value).every(v => !v)
  return activeOps.value.length === 0
})

const gamePhase = ref('idle')
const timeRemaining = ref(120)
const timerInterval = ref(null)
const history = ref([])
const reviewTarget = ref(null)
const scores = ref(loadScores())

function loadScores() {
  try {
    const raw = localStorage.getItem('boiteacalculs-scores')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveScore() {
  const entry = {
    date: Date.now(),
    correct: correct.value,
    total: total.value,
    percent: scorePercent.value,
    mode: mode.value
  }
  scores.value.push(entry)
  try {
    localStorage.setItem('boiteacalculs-scores', JSON.stringify(scores.value))
  } catch {}
}

function startCalcTimer() {
  stopCalcTimer()
  calcTimeLeft.value = localMaxTime.value
  calcInterval.value = setInterval(() => {
    calcTimeLeft.value--
    if (calcTimeLeft.value < 0) {
      stopCalcTimer()
      onCalcTimeout()
    }
  }, 1000)
}

function stopCalcTimer() {
  if (calcInterval.value) {
    clearInterval(calcInterval.value)
    calcInterval.value = null
  }
}

function onCalcTimeout() {
  stopCalcTimer()
  recordHistory(false)
  streak.value = 0
  total.value++
  currentPaper.value = null
  phase.value = 'box'
  feedback.value = '⏰ Temps écoulé !'
  setTimeout(() => { feedback.value = '' }, 1500)
}

const bestScore = computed(() => {
  if (scores.value.length === 0) return null
  return scores.value.reduce((best, s) => s.percent > best.percent ? s : best)
})

const formattedTime = computed(() => {
  const m = Math.floor(timeRemaining.value / 60)
  const s = timeRemaining.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const timerUrgent = computed(() => timeRemaining.value <= 30)
const timerPaused = computed(() => phase.value !== 'question')
const scorePercent = computed(() => total.value ? Math.round(correct.value / total.value * 100) : 0)

function startGame() {
  gamePhase.value = 'playing'
  timeRemaining.value = 120
  history.value = []
  streak.value = 0
  total.value = 0
  correct.value = 0
  showSettings.value = false
  regeneratePapers()
  currentPaper.value = null
  phase.value = 'box'

  timerInterval.value = setInterval(() => {
    if (timerPaused.value) return
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      endGame()
    }
  }, 1000)
}

function endGame() {
  clearInterval(timerInterval.value)
  timerInterval.value = null
  stopCalcTimer()
  currentPaper.value = null
  phase.value = 'box'
  if (total.value > 0) saveScore()
  gamePhase.value = 'finished'
}

function recordHistory(wasCorrect) {
  history.value.push({
    id: Date.now(),
    paper: { ...currentPaper.value },
    userAnswer: mode.value === 'input' ? parseInt(userAnswer.value, 10) : null,
    wasCorrect,
    mode: mode.value,
    corrected: false
  })
}

function newGame() {
  stopCalcTimer()
  gamePhase.value = 'idle'
  currentPaper.value = null
  phase.value = 'box'
  streak.value = 0
  total.value = 0
  correct.value = 0
  history.value = []
  reviewTarget.value = null
  regeneratePapers()
}

function startReview(item) {
  reviewTarget.value = item
  userAnswer.value = ''
  phase.value = 'question'
  showConfetti.value = false
}

function submitReview() {
  if (!reviewTarget.value) return
  const num = parseInt(userAnswer.value, 10)
  if (isNaN(num)) return
  const wasCorrect = num === reviewTarget.value.paper.answer
  reviewTarget.value.wasCorrect = wasCorrect
  reviewTarget.value.corrected = true
  reviewTarget.value.userAnswer = num

  if (wasCorrect) {
    correct.value++
    showConfetti.value = true
    setTimeout(() => { showConfetti.value = false }, 1500)
    feedback.value = 'Corrigé ! Bravo 👏'
  } else {
    feedback.value = `Encore faux... La réponse était ${reviewTarget.value.paper.answer} 💪`
  }
  total.value++

  setTimeout(() => { feedback.value = '' }, 1500)
  setTimeout(() => { reviewTarget.value = null; phase.value = 'box' }, 1500)
}

function cancelReview() {
  stopCalcTimer()
  reviewTarget.value = null
  phase.value = 'box'
}

function drawPaper() {
  if (phase.value !== 'box' || papers.value.length === 0 || noOpSelected.value) return

  const index = rand(0, papers.value.length - 1)
  const paper = papers.value.splice(index, 1)[0]

  currentPaper.value = paper
  phase.value = 'drawing'
  userAnswer.value = ''
  answerCorrect.value = null

  setTimeout(() => {
    phase.value = 'question'
    startCalcTimer()
    if (mode.value === 'input') {
      nextTick(() => {
        const input = document.querySelector('.answer-input')
        if (input) input.focus()
      })
    }
  }, 600)
}

function flipPaper() {
  if (phase.value !== 'question' || mode.value === 'input') return
  stopCalcTimer()
  phase.value = 'answer'
  showConfetti.value = true
  setTimeout(() => { showConfetti.value = false }, 1500)
}

function checkAnswer() {
  if (phase.value !== 'question' || mode.value !== 'input') return
  const num = parseInt(userAnswer.value, 10)
  if (isNaN(num)) return

  stopCalcTimer()
  answerCorrect.value = num === currentPaper.value.answer
  phase.value = 'answer'

  if (answerCorrect.value) {
    correct.value++
    streak.value++
    showConfetti.value = true
    setTimeout(() => { showConfetti.value = false }, 1500)
    feedback.value = streak.value >= 5 ? 'INCROYABLE ! 🔥' : streak.value >= 3 ? 'Super série ! ⭐' : 'Bravo ! 👏'
  } else {
    streak.value = 0
    showError.value = true
    setTimeout(() => { showError.value = false }, 600)
    feedback.value = `Oups ! La réponse était ${currentPaper.value.answer} 💪`
  }
  total.value++

  setTimeout(() => { feedback.value = '' }, 2000)
  if (gamePhase.value === 'playing') recordHistory(answerCorrect.value)
  setTimeout(nextPaper, 2000)
}

function markCorrect() {
  if (phase.value !== 'answer') return
  correct.value++
  total.value++
  streak.value++
  if (gamePhase.value === 'playing') recordHistory(true)
  feedback.value = streak.value >= 5 ? 'INCROYABLE ! 🔥' : streak.value >= 3 ? 'Super série ! ⭐' : 'Bravo ! 👏'
  setTimeout(() => { feedback.value = '' }, 1500)
  setTimeout(nextPaper, 800)
}

function markWrong() {
  if (phase.value !== 'answer') return
  total.value++
  streak.value = 0
  if (gamePhase.value === 'playing') recordHistory(false)
  feedback.value = 'Oups ! La prochaine fois 💪'
  setTimeout(() => { feedback.value = '' }, 1500)
  setTimeout(nextPaper, 800)
}

function nextPaper() {
  stopCalcTimer()
  if (papers.value.length === 0) {
    phase.value = 'empty'
    return
  }
  phase.value = 'box'
  currentPaper.value = null
}
</script>

<template>
  <div class="boite-container">
    <div class="header">
      <div class="header-top">
        <h1 class="title">🧮 Boîte à Calculs</h1>
        <button class="settings-btn" :class="{ open: showSettings }" @click="toggleSettings" title="Paramètres">⚙️</button>
      </div>
      <div v-if="gamePhase === 'playing'" class="timer" :class="{ urgent: timerUrgent, paused: timerPaused }">
        <span class="timer-icon">{{ timerPaused ? '⏸️' : '⏱️' }}</span>
        <span class="timer-value">{{ formattedTime }}</span>
      </div>
      <div class="stats" v-if="gamePhase !== 'idle'">
        <span class="stat" title="Bonne réponse">✅ {{ correct }}</span>
        <span class="stat" title="Total">📝 {{ total }}</span>
        <span v-if="scorePercent > 0" class="stat score">{{ scorePercent }}%</span>
        <span v-if="emoji && gamePhase === 'playing'" class="streak-emoji">{{ emoji }} {{ streak }}</span>
      </div>
    </div>

    <SettingsPanel
      v-if="showSettings"
      :game-mode="gameMode"
      :mode="mode"
      :local-max-time="localMaxTime"
      :op-options="opOptions"
      :local-config="localConfig"
      :table-ops="tableOps"
      :selected-tables="selectedTables"
      @toggle-settings="toggleSettings"
      @update:game-mode="gameMode = $event"
      @update:mode="mode = $event"
      @update:local-max-time="localMaxTime = $event"
      @toggle-op="handleToggleOp"
      @update-config="handleUpdateConfig"
      @update:table-ops="tableOps = $event"
      @update:selected-tables="selectedTables = $event"
      @reset-config="resetConfig"
    />

    <div v-if="feedback" class="feedback" :class="{ correct: streak > 0 }">
      {{ feedback }}
    </div>

    <div v-if="gamePhase === 'idle'" class="idle-screen">
      <div class="idle-box">
        <span class="idle-icon">🧮</span>
        <p class="idle-text">Prêt à faire des calculs ?</p>
        <p class="idle-sub">Fait le maximum de calcul et bats ton record 🏆</p>
        <button class="btn btn-start" :disabled="noOpSelected" @click="startGame">🏁 Lancer la partie !</button>
        <p v-if="noOpSelected" class="idle-warn">Active d'abord des opérations dans ⚙️ Paramètres</p>

        <div v-if="scores.length > 0" class="scores-summary">
          <div class="scores-title">🏅 Meilleurs scores</div>
          <div class="scores-row">
            <span class="scores-best">{{ bestScore.percent }}%</span>
            <span class="scores-detail">{{ bestScore.correct }}/{{ bestScore.total }}</span>
            <span class="scores-count">{{ scores.length }} parties</span>
          </div>
        </div>
      </div>
    </div>

    <ResultsScreen
      v-else-if="gamePhase === 'finished'"
      :correct="correct"
      :total="total"
      :score-percent="scorePercent"
      :best-score="bestScore"
      :history="history"
      :scores="scores"
      @new-game="newGame"
      @start-review="startReview"
    />

    <ReviewStage
      v-else-if="reviewTarget"
      :review-target="reviewTarget"
      v-model="userAnswer"
      @submit-review="submitReview"
      @cancel-review="cancelReview"
    />

    <div v-else class="game-area">
      <div v-if="noOpSelected" class="no-op-message">
        <span class="no-op-icon">⚙️</span>
        <p>Choisis au moins une opération pour commencer !</p>
      </div>

      <GameBox
        v-else-if="phase === 'box' || phase === 'drawing' || phase === 'empty'"
        :remaining="remaining"
        :phase="phase"
        :message="message"
        @draw-paper="drawPaper"
      />

      <PaperCard
        v-if="currentPaper && (phase === 'question' || phase === 'answer')"
        :current-paper="currentPaper"
        :phase="phase"
        :mode="mode"
        :calc-percent="calcPercent"
        :calc-urgent="calcUrgent"
        :game-phase="gamePhase"
        :answer-correct="answerCorrect"
        v-model="userAnswer"
        :show-error="showError"
        @flip-paper="flipPaper"
        @check-answer="checkAnswer"
        @mark-correct="markCorrect"
        @mark-wrong="markWrong"
      />
    </div>

    <div v-if="showConfetti" class="confetti-container">
      <div v-for="i in 30" :key="i" class="confetti-piece" :style="{
        left: rand(0, 100) + '%',
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347'][i % 5],
        animationDelay: (i * 0.05) + 's',
        animationDuration: (1 + Math.random()) + 's'
      }" />
    </div>
  </div>
</template>

<style scoped>
.boite-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: 0.8rem;
  user-select: none;
  position: relative;
  overflow-y: auto;
  color: #333;
}

.header { text-align: center; margin-bottom: 1rem; }

.title {
  font-size: 2rem;
  color: #FF6B6B;
  text-shadow: 2px 2px 0 #FFE66D;
  margin-bottom: 0.5rem;
}

.stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  font-size: 1.2rem;
}

.stat {
  background: #f0f0f0;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
}

.streak-emoji {
  background: #FFE66D;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
  animation: pop 0.3s ease;
}

@keyframes pop {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  transition: transform 0.3s;
  padding: 0;
  line-height: 1;
}

.settings-btn:hover { transform: rotate(45deg); }
.settings-btn.open { transform: rotate(45deg); }

.no-op-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.no-op-icon {
  font-size: 4rem;
  animation: pulse 2s ease-in-out infinite;
}

.no-op-message p {
  font-size: 1.2rem;
  color: #666;
  font-weight: bold;
}

.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  animation: pop 0.3s ease;
}

.timer.urgent {
  color: #FF6B6B;
  animation: urgentPulse 0.5s ease-in-out infinite;
}

@keyframes urgentPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.timer.paused { opacity: 0.6; }
.timer-icon { font-size: 1.6rem; }
.timer-value { font-variant-numeric: tabular-nums; }

.stat.score {
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
}

.idle-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.idle-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.idle-icon {
  font-size: 5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.idle-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.idle-sub {
  font-size: 1rem;
  color: #ccc;
  margin-top: -0.5rem;
}

.idle-warn {
  font-size: 0.9rem;
  color: #FF6B6B;
  font-weight: bold;
}

.btn-start {
  background: linear-gradient(135deg, #FF6B6B, #ee5a24);
  color: white;
  font-size: 1.4rem;
  padding: 1.2rem 3rem;
  animation: pop 0.5s ease;
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scores-summary {
  margin-top: 1.5rem;
  padding: 0.8rem 1.2rem;
  background: rgba(255,255,255,0.5);
  border-radius: 12px;
  text-align: center;
}

.scores-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.scores-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.6rem;
}

.scores-best {
  font-size: 2rem;
  font-weight: 900;
  color: #FF6B6B;
}

.scores-detail {
  font-size: 1rem;
  color: #666;
  font-weight: bold;
}

.scores-count {
  font-size: 0.85rem;
  color: #999;
}

.feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  background: #FFE66D;
  padding: 1rem 2rem;
  border-radius: 20px;
  z-index: 100;
  animation: feedbackPop 0.5s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.feedback.correct {
  background: #4ECDC4;
  color: white;
}

@keyframes feedbackPop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.game-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 200;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confettiFall 1.5s ease-out forwards;
}

@keyframes confettiFall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.btn {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.btn:active { transform: translateY(0); }

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
