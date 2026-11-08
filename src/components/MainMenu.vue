<script setup>
import { formatTime } from '@/lib/game'

const props = defineProps({
  games: { type: Array, default: () => [] },
  scores: { type: Array, default: () => [] },
  bestScore: { type: Object, default: null }
})

const emit = defineEmits(['new-game', 'resume', 'delete'])

function gamePercent(game) {
  return game.total ? Math.round(game.correct / game.total * 100) : 0
}

function gameLabel(game) {
  return game.gameMode === 'table' ? 'Tables' : 'Calculs'
}

function modeLabel(game) {
  return game.mode === 'input' ? '✏️ Écrire' : '🃏 Retourner'
}

function confirmDelete(game) {
  if (window.confirm('Supprimer cette partie en cours ?')) {
    emit('delete', game.id)
  }
}
</script>

<template>
  <div class="main-menu">
    <div class="menu-hero">
      <span class="hero-icon">🧮</span>
      <h1 class="hero-title">Boîte à Calculs</h1>
      <p class="hero-sub">Reprends une partie ou lance-toi dans un nouveau défi !</p>
      <div class="mode-buttons">
        <button class="mode-choice normal" @click="emit('new-game', 'normal')">
          <span class="choice-icon">🧮</span>
          <span class="choice-title">Mode normal</span>
          <span class="choice-sub">+ − × ÷</span>
        </button>
        <button class="mode-choice table" @click="emit('new-game', 'table')">
          <span class="choice-icon">📋</span>
          <span class="choice-title">Mode tables</span>
          <span class="choice-sub">Tables de 1 à 9</span>
        </button>
      </div>
    </div>

    <div v-if="games.length > 0" class="menu-section">
      <h2 class="section-title">⏸️ Parties en cours</h2>
      <div class="game-list">
        <div v-for="game in games" :key="game.id" class="game-card">
          <div class="game-main" @click="emit('resume', game.id)">
            <div class="game-badge">{{ game.gameMode === 'table' ? '📋' : '🧮' }}</div>
            <div class="game-info">
              <div class="game-name">{{ gameLabel(game) }} · {{ modeLabel(game) }}</div>
              <div class="game-meta">
                <span :class="{ urgent: game.timeRemaining <= 30 }">⏱️ {{ formatTime(game.timeRemaining) }}</span>
                <span>✅ {{ game.correct }}/{{ game.total }}</span>
                <span>📄 {{ game.papers.length }}</span>
              </div>
            </div>
            <div class="game-score">{{ gamePercent(game) }}%</div>
          </div>
          <div class="game-actions">
            <button class="btn-resume" @click="emit('resume', game.id)">▶ Reprendre</button>
            <button class="btn-delete" title="Supprimer la partie" @click="confirmDelete(game)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="menu-empty">Aucune partie en cours. Lance ta première partie !</p>

    <div v-if="scores.length > 0" class="best-card">
      <div class="best-title">🏅 Meilleur score</div>
      <div class="best-row">
        <span class="best-percent">{{ bestScore.percent }}%</span>
        <span class="best-detail">{{ bestScore.correct }}/{{ bestScore.total }}</span>
        <span class="best-count">{{ scores.length }} partie{{ scores.length > 1 ? 's' : '' }} terminée{{ scores.length > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-menu {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0 2rem;
}

.menu-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  padding: 1rem;
}

.hero-icon {
  font-size: 4.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-title {
  font-size: 2.2rem;
  color: #FF6B6B;
  text-shadow: 2px 2px 0 #FFE66D;
}

.hero-sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.mode-buttons {
  display: flex;
  gap: 0.7rem;
  width: 100%;
  margin-top: 0.4rem;
}

.mode-choice {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  border: none;
  border-radius: 16px;
  padding: 1rem 0.6rem;
  font-family: inherit;
  cursor: pointer;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.mode-choice.normal { background: linear-gradient(135deg, #FF6B6B, #ee5a24); }
.mode-choice.table { background: linear-gradient(135deg, #4ECDC4, #44B09E); }

.mode-choice:hover {
  transform: translateY(-3px);
  box-shadow: 0 9px 26px rgba(0, 0, 0, 0.28);
}

.choice-icon { font-size: 1.8rem; }
.choice-title { font-size: 1.05rem; font-weight: bold; }
.choice-sub { font-size: 0.75rem; opacity: 0.9; font-weight: bold; }

@keyframes pop {
  0% { transform: scale(0.8); }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.section-title {
  font-size: 1rem;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.game-card {
  background: white;
  border-radius: 16px;
  padding: 0.7rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-main {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
}

.game-badge {
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
  min-width: 0;
}

.game-name {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.game-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #777;
  font-weight: bold;
}

.game-meta .urgent { color: #FF6B6B; }

.game-score {
  font-size: 1.35rem;
  font-weight: 900;
  color: #4ECDC4;
  flex-shrink: 0;
}

.game-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-resume {
  flex: 1;
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.95rem;
  font-weight: bold;
  font-family: inherit;
  cursor: pointer;
  transition: filter 0.2s;
}

.btn-resume:hover { filter: brightness(1.08); }

.btn-delete {
  background: #f5f5f5;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-delete:hover { background: #ffe0e0; }

.menu-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-weight: bold;
  padding: 1rem;
}

.best-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1rem 1.2rem;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.best-title {
  font-size: 0.8rem;
  font-weight: bold;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.best-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.best-percent {
  font-size: 2rem;
  font-weight: 900;
  color: #FF6B6B;
}

.best-detail {
  font-size: 1rem;
  color: #666;
  font-weight: bold;
}

.best-count {
  font-size: 0.8rem;
  color: #999;
}
</style>
