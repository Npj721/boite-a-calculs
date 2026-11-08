<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import GameBox from './GameBox.vue'
import PaperCard from './PaperCard.vue'
import { formatTime, rand } from '@/lib/game'

const props = defineProps({
  game: { type: Object, required: true }
})

const emit = defineEmits(['exit', 'finished'])

const game = props.game

const userAnswer = ref('')
const showConfetti = ref(false)
const feedback = ref('')
const showError = ref(false)
const answerCorrect = ref(null)

let gameTimer = null
let calcTimer = null
let feedbackTimeout = null
let confettiTimeout = null
const pendingTimeouts = new Set()

function later(fn, ms) {
  const id = setTimeout(() => {
    pendingTimeouts.delete(id)
    fn()
  }, ms)
  pendingTimeouts.add(id)
  return id
}

function clearPending() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.clear()
  if (feedbackTimeout) clearTimeout(feedbackTimeout)
  if (confettiTimeout) clearTimeout(confettiTimeout)
  feedbackTimeout = null
  confettiTimeout = null
}

function flash(msg, ms = 1500) {
  feedback.value = msg
  if (feedbackTimeout) clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    feedback.value = ''
    feedbackTimeout = null
  }, ms)
}

function burstConfetti() {
  showConfetti.value = true
  if (confettiTimeout) clearTimeout(confettiTimeout)
  confettiTimeout = setTimeout(() => {
    showConfetti.value = false
    confettiTimeout = null
  }, 1500)
}

const remaining = computed(() => game.papers.length)
const calcPercent = computed(() => game.maxTimePerCalc ? (game.calcTimeLeft / game.maxTimePerCalc) * 100 : 0)
const calcUrgent = computed(() => game.calcTimeLeft <= 10)
const timerUrgent = computed(() => game.timeRemaining <= 30)
const timerPaused = computed(() => game.phase !== 'question')
const scorePercent = computed(() => game.total ? Math.round(game.correct / game.total * 100) : 0)
const formattedTime = computed(() => formatTime(game.timeRemaining))

const emoji = computed(() => {
  if (game.streak >= 5) return '🔥'
  if (game.streak >= 3) return '⭐'
  if (game.streak >= 1) return '👏'
  return ''
})

const message = computed(() => {
  if (game.phase === 'empty') return 'Plus de papiers !'
  if (remaining.value <= 5) return 'Plus que quelques papiers !'
  return ''
})

const modeTitle = computed(() => {
  if (game.gameMode === 'table') return '📋 Tables'
  if (game.gameMode === 'mix') return '🔀 Mixte'
  return '🧮 Calculs'
})

function startGameTimer() {
  stopGameTimer()
  gameTimer = setInterval(() => {
    if (game.phase !== 'question') return
    game.timeRemaining--
    if (game.timeRemaining <= 0) {
      game.timeRemaining = 0
      finishGame('time')
    }
  }, 1000)
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

function startCalcTimer(reset = true) {
  stopCalcTimer()
  if (reset) game.calcTimeLeft = game.maxTimePerCalc
  calcTimer = setInterval(() => {
    game.calcTimeLeft--
    if (game.calcTimeLeft < 0) {
      stopCalcTimer()
      onCalcTimeout()
    }
  }, 1000)
}

function stopCalcTimer() {
  if (calcTimer) {
    clearInterval(calcTimer)
    calcTimer = null
  }
}

function recordHistory(wasCorrect) {
  if (!game.currentPaper) return
  game.history.push({
    id: Date.now() + Math.random(),
    paper: { ...game.currentPaper },
    userAnswer: game.mode === 'input' ? parseInt(userAnswer.value, 10) : null,
    wasCorrect,
    mode: game.mode,
    corrected: false
  })
}

function finishGame(reason) {
  stopGameTimer()
  stopCalcTimer()
  clearPending()
  game.status = 'finished'
  game.finishReason = reason
  game.phase = 'box'
  game.currentPaper = null
  emit('finished')
}

function endQuestion() {
  stopCalcTimer()
  game.currentPaper = null
  game.answerLocked = false
  if (game.papers.length === 0) {
    finishGame('empty')
    return
  }
  game.phase = 'box'
}

function onCalcTimeout() {
  stopCalcTimer()
  recordHistory(false)
  game.streak = 0
  game.total++
  flash('⏰ Temps écoulé !')
  endQuestion()
}

function drawPaper() {
  if (game.phase !== 'box' || game.papers.length === 0) return

  const index = rand(0, game.papers.length - 1)
  const paper = game.papers.splice(index, 1)[0]

  game.currentPaper = paper
  game.phase = 'drawing'
  game.calcTimeLeft = game.maxTimePerCalc
  userAnswer.value = ''
  answerCorrect.value = null

  later(() => {
    if (game.phase !== 'drawing') return
    game.phase = 'question'
    startCalcTimer(false)
    if (game.mode === 'input') focusInput()
  }, 600)
}

function focusInput() {
  nextTick(() => {
    const input = document.querySelector('.game-session .answer-input')
    if (input) input.focus()
  })
}

function flipPaper() {
  if (game.phase !== 'question' || game.mode === 'input') return
  stopCalcTimer()
  game.phase = 'answer'
  burstConfetti()
}

function checkAnswer() {
  if (game.phase !== 'question' || game.mode !== 'input') return
  const num = parseInt(userAnswer.value, 10)
  if (isNaN(num)) return

  stopCalcTimer()
  answerCorrect.value = num === game.currentPaper.answer
  game.phase = 'answer'

  if (answerCorrect.value) {
    game.correct++
    game.streak++
    burstConfetti()
    flash(game.streak >= 5 ? 'INCROYABLE ! 🔥' : game.streak >= 3 ? 'Super série ! ⭐' : 'Bravo ! 👏')
  } else {
    game.streak = 0
    showError.value = true
    later(() => { showError.value = false }, 600)
    flash(`Oups ! La réponse était ${game.currentPaper.answer} 💪`, 2000)
  }
  game.total++
  recordHistory(answerCorrect.value)
  later(nextPaper, 2000)
}

function markCorrect() {
  if (game.phase !== 'answer' || game.mode !== 'flip' || game.answerLocked) return
  game.answerLocked = true
  game.correct++
  game.total++
  game.streak++
  recordHistory(true)
  flash(game.streak >= 5 ? 'INCROYABLE ! 🔥' : game.streak >= 3 ? 'Super série ! ⭐' : 'Bravo ! 👏')
  later(nextPaper, 800)
}

function markWrong() {
  if (game.phase !== 'answer' || game.mode !== 'flip' || game.answerLocked) return
  game.answerLocked = true
  game.total++
  game.streak = 0
  recordHistory(false)
  flash('Oups ! La prochaine fois 💪')
  later(nextPaper, 800)
}

function nextPaper() {
  endQuestion()
}

function normalizeOnPause() {
  if (game.phase === 'drawing') {
    game.phase = 'question'
  } else if (game.phase === 'answer' && (game.mode === 'input' || game.answerLocked)) {
    game.phase = 'box'
    game.currentPaper = null
    game.answerLocked = false
  }
}

function exitToMenu() {
  stopGameTimer()
  stopCalcTimer()
  clearPending()
  normalizeOnPause()
  emit('exit')
}

onMounted(() => {
  if (game.phase === 'drawing') {
    game.phase = game.currentPaper ? 'question' : 'box'
  }

  if (game.phase === 'answer' && (game.mode === 'input' || game.answerLocked)) {
    game.phase = 'box'
    game.currentPaper = null
    game.answerLocked = false
  }

  if (!game.currentPaper && game.phase === 'question') {
    game.phase = 'box'
  }

  if (game.papers.length === 0 && game.phase !== 'question') {
    finishGame('empty')
    return
  }

  startGameTimer()
  if (game.phase === 'question') {
    startCalcTimer(false)
    if (game.mode === 'input') focusInput()
  }
})

onBeforeUnmount(() => {
  stopGameTimer()
  stopCalcTimer()
  clearPending()
})
</script>

<template>
  <div class="game-session">
    <div class="header">
      <div class="header-top">
        <button class="menu-btn" @click="exitToMenu">☰ Menu</button>
        <h1 class="title">Boîte à Calculs</h1>
        <span class="mode-chip">{{ modeTitle }}</span>
      </div>
      <div v-if="game.status === 'playing'" class="timer" :class="{ urgent: timerUrgent, paused: timerPaused }">
        <span class="timer-icon">{{ timerPaused ? '⏸️' : '⏱️' }}</span>
        <span class="timer-value">{{ formattedTime }}</span>
      </div>
      <div class="stats">
        <span class="stat" title="Bonne réponse">✅ {{ game.correct }}</span>
        <span class="stat" title="Total">📝 {{ game.total }}</span>
        <span v-if="scorePercent > 0" class="stat score">{{ scorePercent }}%</span>
        <span v-if="emoji" class="streak-emoji">{{ emoji }} {{ game.streak }}</span>
      </div>
    </div>

    <div v-if="feedback" class="feedback" :class="{ correct: game.streak > 0 }">
      {{ feedback }}
    </div>

    <div class="game-area">
      <GameBox
        v-if="game.phase === 'box' || game.phase === 'drawing' || game.phase === 'empty'"
        :remaining="remaining"
        :phase="game.phase"
        :message="message"
        @draw-paper="drawPaper"
      />

      <PaperCard
        v-if="game.currentPaper && (game.phase === 'question' || game.phase === 'answer')"
        :current-paper="game.currentPaper"
        :phase="game.phase"
        :mode="game.mode"
        :calc-percent="calcPercent"
        :calc-urgent="calcUrgent"
        :game-phase="game.status"
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
      <div
        v-for="i in 30"
        :key="i"
        class="confetti-piece"
        :style="{
          left: rand(0, 100) + '%',
          backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347'][i % 5],
          animationDelay: (i * 0.05) + 's',
          animationDuration: (1 + Math.random()) + 's'
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.game-session {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.header { text-align: center; margin-bottom: 1rem; width: 100%; }

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  position: relative;
}

.title {
  font-size: 2rem;
  color: #FF6B6B;
  text-shadow: 2px 2px 0 #FFE66D;
}

.menu-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50px;
  padding: 0.45rem 0.8rem;
  font-size: 0.85rem;
  font-weight: bold;
  font-family: inherit;
  color: #555;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-btn:hover { background: white; }

.mode-chip {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  font-weight: bold;
  color: #666;
  white-space: nowrap;
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

.stat.score {
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
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
  text-align: center;
  max-width: 90vw;
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

@media (max-width: 420px) {
  .title { font-size: 1.5rem; }
  .mode-chip { font-size: 0.65rem; padding: 0.25rem 0.5rem; }
  .menu-btn { font-size: 0.75rem; padding: 0.4rem 0.6rem; }
}
</style>
