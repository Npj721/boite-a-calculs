<script setup>
import { computed, ref, watch } from 'vue'
import MainMenu from './MainMenu.vue'
import SettingsPanel from './SettingsPanel.vue'
import GameSession from './GameSession.vue'
import ResultsScreen from './ResultsScreen.vue'
import ReviewStage from './ReviewStage.vue'
import {
  clone,
  createGame,
  defaultSettings,
  isSettingsPlayable,
  normalizeGame,
  normalizeSettings,
  rand
} from '@/lib/game'

const GAMES_KEY = 'boiteacalculs-games-v2'
const SCORES_KEY = 'boiteacalculs-scores'
const SETTINGS_KEY = 'boiteacalculs-settings-v2'

const games = ref(loadGames())
const scores = ref(loadScores())
const draft = ref(loadDraft())
const showSettings = ref(false)
const view = ref('menu')
const activeGameId = ref(null)
const lastResult = ref(null)

const reviewTarget = ref(null)
const reviewAnswer = ref('')
const reviewFeedback = ref('')
const reviewCorrect = ref(false)
const reviewConfetti = ref(false)

const activeGame = computed(() => games.value.find(game => game.id === activeGameId.value) || null)
const bestScore = computed(() => bestOf(scores.value))
const draftInvalid = computed(() => !isSettingsPlayable(draft.value))

const resultGame = computed(() => lastResult.value ? lastResult.value.game : null)
const resultBestScore = computed(() => lastResult.value ? lastResult.value.previousBest : null)
const resultPercent = computed(() => {
  const game = resultGame.value
  return game && game.total ? Math.round(game.correct / game.total * 100) : 0
})

function bestOf(list) {
  if (!list || list.length === 0) return null
  return list.reduce((best, score) => score.percent > best.percent ? score : best)
}

function loadGames() {
  try {
    const raw = JSON.parse(localStorage.getItem(GAMES_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeGame).filter(Boolean)
  } catch {
    return []
  }
}

function loadScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function loadDraft() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'))
  } catch {
    return defaultSettings()
  }
}

function saveDraft() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(draft.value))
  } catch {}
}

watch(games, () => {
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games.value))
  } catch {}
}, { deep: true })

watch(scores, () => {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores.value))
  } catch {}
}, { deep: true })

function openNewGame(mode) {
  const saved = loadDraft()
  if (mode === 'normal' || mode === 'table') saved.gameMode = mode
  draft.value = saved
  reviewTarget.value = null
  reviewFeedback.value = ''
  showSettings.value = true
}

function toggleDraftOp(op) {
  draft.value.opOptions = { ...draft.value.opOptions, [op]: !draft.value.opOptions[op] }
}

function handleUpdateConfig({ op, key, val }) {
  draft.value.config[op][key] = val
}

function resetDraft() {
  draft.value = defaultSettings()
}

function startNewGame() {
  if (draftInvalid.value) return
  const game = createGame(draft.value)
  games.value.push(game)
  saveDraft()
  showSettings.value = false
  lastResult.value = null
  reviewTarget.value = null
  activeGameId.value = game.id
  view.value = 'game'
}

function resumeGame(id) {
  if (!games.value.some(game => game.id === id)) return
  activeGameId.value = id
  view.value = 'game'
}

function deleteGame(id) {
  games.value = games.value.filter(game => game.id !== id)
  if (activeGameId.value === id) {
    activeGameId.value = null
    view.value = 'menu'
  }
}

function exitToMenu() {
  view.value = 'menu'
  activeGameId.value = null
}

function handleFinished() {
  const game = activeGame.value
  if (!game) return
  game.status = 'finished'

  const previousBest = bestOf(scores.value)
  const percent = game.total ? Math.round(game.correct / game.total * 100) : 0

  if (game.total > 0) {
    scores.value.push({
      date: Date.now(),
      correct: game.correct,
      total: game.total,
      percent,
      mode: game.mode,
      gameMode: game.gameMode,
      duration: game.duration,
      finishReason: game.finishReason
    })
  }

  lastResult.value = { game: clone(game), previousBest }
  games.value = games.value.filter(item => item.id !== game.id)
  activeGameId.value = null
  view.value = 'results'
}

function backToMenu() {
  view.value = 'menu'
  lastResult.value = null
  reviewTarget.value = null
  reviewFeedback.value = ''
}

function startReview(item) {
  reviewTarget.value = item
  reviewAnswer.value = ''
  reviewFeedback.value = ''
  reviewCorrect.value = false
  reviewConfetti.value = false
}

function submitReview() {
  if (!reviewTarget.value || !resultGame.value) return
  const num = parseInt(reviewAnswer.value, 10)
  if (isNaN(num)) return

  const wasCorrect = num === reviewTarget.value.paper.answer
  reviewTarget.value.wasCorrect = wasCorrect
  reviewTarget.value.corrected = true
  reviewTarget.value.userAnswer = num

  const game = resultGame.value
  if (wasCorrect) {
    game.correct++
    game.total++
    reviewCorrect.value = true
    reviewConfetti.value = true
    reviewFeedback.value = 'Corrigé ! Bravo 👏'
    setTimeout(() => { reviewConfetti.value = false }, 1500)
  } else {
    game.total++
    reviewCorrect.value = false
    reviewFeedback.value = `Encore faux... La réponse était ${reviewTarget.value.paper.answer} 💪`
  }

  setTimeout(() => { reviewFeedback.value = '' }, 1500)
  setTimeout(() => { reviewTarget.value = null }, 1500)
}

function cancelReview() {
  reviewTarget.value = null
  reviewAnswer.value = ''
  reviewFeedback.value = ''
}
</script>

<template>
  <div class="boite-container">
    <MainMenu
      v-if="view === 'menu'"
      :games="games"
      :scores="scores"
      :best-score="bestScore"
      @new-game="openNewGame"
      @resume="resumeGame"
      @delete="deleteGame"
    />

    <GameSession
      v-else-if="view === 'game' && activeGame"
      :key="activeGame.id"
      :game="activeGame"
      @exit="exitToMenu"
      @finished="handleFinished"
    />

    <template v-else-if="view === 'results' && resultGame">
      <ReviewStage
        v-if="reviewTarget"
        :review-target="reviewTarget"
        v-model="reviewAnswer"
        @submit-review="submitReview"
        @cancel-review="cancelReview"
      />
      <ResultsScreen
        v-else
        :correct="resultGame.correct"
        :total="resultGame.total"
        :score-percent="resultPercent"
        :best-score="resultBestScore"
        :finish-reason="resultGame.finishReason"
        :history="resultGame.history"
        :scores="scores"
        @new-game="openNewGame"
        @back-to-menu="backToMenu"
        @start-review="startReview"
      />
    </template>

    <SettingsPanel
      v-if="showSettings"
      :game-mode="draft.gameMode"
      :mode="draft.mode"
      :duration="draft.duration"
      :local-max-time="draft.maxTimePerCalc"
      :op-options="draft.opOptions"
      :local-config="draft.config"
      :table-ops="draft.tableOps"
      :selected-tables="draft.selectedTables"
      :invalid="draftInvalid"
      @toggle-settings="showSettings = false"
      @update:game-mode="draft.gameMode = $event"
      @update:mode="draft.mode = $event"
      @update:duration="draft.duration = $event"
      @update:local-max-time="draft.maxTimePerCalc = $event"
      @toggle-op="toggleDraftOp"
      @update-config="handleUpdateConfig"
      @update:table-ops="draft.tableOps = $event"
      @update:selected-tables="draft.selectedTables = $event"
      @reset-config="resetDraft"
      @start-game="startNewGame"
    />

    <div v-if="reviewFeedback" class="feedback" :class="{ correct: reviewCorrect }">
      {{ reviewFeedback }}
    </div>

    <div v-if="reviewConfetti" class="confetti-container">
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
</style>
