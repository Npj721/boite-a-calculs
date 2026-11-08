<script setup>
defineProps({
  correct: Number,
  total: Number,
  scorePercent: Number,
  bestScore: Object,
  finishReason: String,
  history: Array,
  scores: Array
})

const emit = defineEmits(['new-game', 'back-to-menu', 'start-review'])
</script>

<template>
  <div class="results-screen">
    <div class="results-card">
      <div class="results-header">
        <span class="results-icon">🏆</span>
        <h2>{{ finishReason === 'empty' ? 'Toutes les cartes terminées !' : 'Temps écoulé !' }}</h2>
      </div>
      <div class="results-score">
        <span class="results-num">{{ correct }}</span>
        <span class="results-sep">/</span>
        <span class="results-num">{{ total }}</span>
        <span class="results-pct">({{ scorePercent }}%)</span>
      </div>
      <p class="results-label">bonnes réponses</p>

      <div v-if="total > 0 && (!bestScore || scorePercent > bestScore.percent)" class="new-record">
        ⭐ Nouveau record !
      </div>

      <div v-if="history.length > 0" class="history-list">
        <div
          v-for="item in history"
          :key="item.id"
          class="history-item"
          :class="{ correct: item.wasCorrect, wrong: !item.wasCorrect }"
        >
          <span class="history-q">{{ item.paper.question }}</span>
          <span class="history-arrow">→</span>
          <span class="history-a">{{ item.paper.answer }}</span>
          <span class="history-badge">{{ item.wasCorrect ? '✅' : '❌' }}</span>
          <button
            v-if="!item.wasCorrect"
            class="history-review-btn"
            @click="emit('start-review', item)"
          >✏️ Corriger</button>
        </div>
      </div>

      <div class="results-actions">
        <button class="btn btn-back" @click="emit('back-to-menu')">☰ Menu</button>
        <button class="btn btn-start" @click="emit('new-game')">🔄 Nouvelle partie</button>
      </div>

      <div v-if="scores.length > 1" class="scores-history">
        <div class="scores-title">📊 Dernières parties</div>
        <div
          v-for="(s, i) in [...scores].reverse().slice(0, 10)"
          :key="i"
          class="scores-mini-row"
        >
          <span class="scores-mini-pct">{{ s.percent }}%</span>
          <span class="scores-mini-detail">{{ s.correct }}/{{ s.total }}</span>
          <span class="scores-mini-date">{{ new Date(s.date).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem;
}

.results-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 80vh;
  overflow-y: auto;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.results-icon { font-size: 2.5rem; }

.results-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.results-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.2rem;
}

.results-num {
  font-size: 3.5rem;
  font-weight: 900;
  color: #333;
}

.results-sep {
  font-size: 2rem;
  color: #999;
}

.results-pct {
  font-size: 1.2rem;
  color: #666;
  margin-left: 0.3rem;
}

.results-label {
  font-size: 1rem;
  color: #666;
  margin-top: -0.5rem;
}

.new-record {
  font-size: 1.2rem;
  font-weight: bold;
  color: #FFB347;
  animation: pop 0.5s ease;
}

@keyframes pop {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  flex-wrap: wrap;
}

.history-item.correct { background: rgba(78, 205, 196, 0.12); }
.history-item.wrong { background: rgba(255, 107, 107, 0.12); }

.history-q {
  font-size: 1.1rem;
  color: #333;
  min-width: 80px;
}

.history-arrow {
  color: #ccc;
  font-size: 0.9rem;
}

.history-a {
  font-size: 1.1rem;
  color: #333;
  min-width: 30px;
}

.history-badge {
  font-size: 1rem;
  margin-left: auto;
}

.history-review-btn {
  background: none;
  border: 2px solid #FFB347;
  border-radius: 8px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: bold;
  color: #FFB347;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.history-review-btn:hover {
  background: #FFB347;
  color: white;
}

.results-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.btn-back {
  background: #f0f0f0;
  color: #666;
}

.btn-back:hover { background: #e0e0e0; }

.btn-start {
  background: linear-gradient(135deg, #FF6B6B, #ee5a24);
  color: white;
  font-size: 1.15rem;
  padding: 1rem 2rem;
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

.scores-history { margin-top: 1rem; text-align: left; }

.scores-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.scores-mini-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}

.scores-mini-row:last-child { border-bottom: none; }

.scores-mini-pct {
  font-weight: bold;
  color: #4ECDC4;
  min-width: 40px;
}

.scores-mini-detail {
  color: #666;
  min-width: 50px;
}

.scores-mini-date {
  color: #999;
  font-size: 0.8rem;
  margin-left: auto;
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
</style>
