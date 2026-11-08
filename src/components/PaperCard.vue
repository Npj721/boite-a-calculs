<script setup>
defineProps({
  currentPaper: Object,
  phase: String,
  mode: String,
  calcPercent: Number,
  calcUrgent: Boolean,
  gamePhase: String,
  answerCorrect: [Boolean, null],
  modelValue: String,
  showError: Boolean
})

const emit = defineEmits([
  'flip-paper',
  'update:modelValue',
  'check-answer',
  'mark-correct',
  'mark-wrong'
])
</script>

<template>
  <div class="paper-stage">
    <div
      class="paper-card"
      :class="{ flipped: phase === 'answer', 'input-mode': mode === 'input' }"
      @click="emit('flip-paper')"
    >
      <div class="paper-inner" :style="{ backgroundColor: currentPaper.color }">
        <div v-if="gamePhase === 'playing' && phase === 'question'" class="calc-timer-bar">
          <div
            class="calc-timer-fill"
            :class="{ urgent: calcUrgent }"
            :style="{ width: calcPercent + '%' }"
          ></div>
        </div>
        <div class="paper-front">
          <div class="paper-label">Calcule :</div>
          <div class="paper-question">{{ currentPaper.question }}</div>
          <div class="paper-hint" v-if="mode === 'flip'">Clique pour voir la réponse</div>
          <div class="paper-hint" v-else>Écris ta réponse puis valide</div>
        </div>
        <div class="paper-back">
          <div class="paper-label">Résultat :</div>
          <div class="paper-answer">{{ currentPaper.answer }}</div>
          <div
            v-if="mode === 'input' && answerCorrect !== null"
            class="answer-badge"
            :class="{ correct: answerCorrect, wrong: !answerCorrect }"
          >
            {{ answerCorrect ? '✅ Juste !' : '❌ Faux' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="mode === 'input' && phase === 'question'" class="input-area">
      <input
        class="answer-input"
        :class="{ shake: showError }"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        type="number"
        placeholder="?"
        @keydown.enter="emit('check-answer')"
      />
      <button class="btn btn-validate" @click="emit('check-answer')">Valider ✅</button>
    </div>

    <div v-if="phase === 'answer' && mode === 'flip'" class="action-buttons">
      <button class="btn btn-correct" @click="emit('mark-correct')">✅ J'ai trouvé !</button>
      <button class="btn btn-wrong" @click="emit('mark-wrong')">❌ Pas trouvé</button>
    </div>
  </div>
</template>

<style scoped>
.paper-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  max-width: 400px;
  padding-bottom: 1rem;
}

.paper-card {
  width: min(280px, 85vw);
  height: min(350px, 55vh);
  perspective: 1000px;
  -webkit-perspective: 1000px;
  cursor: pointer;
  flex-shrink: 0;
}

.paper-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  overflow: visible;
}

.paper-card.flipped .paper-inner {
  transform: rotateY(180deg);
}

.paper-front,
.paper-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 1.2rem;
  box-sizing: border-box;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.paper-front { background: inherit; }

.paper-back {
  background: inherit;
  transform: rotateY(180deg);
  filter: brightness(1.05);
}

.paper-label {
  font-size: 1rem;
  color: rgba(0,0,0,0.5);
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.paper-question {
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: bold;
  color: #333;
  letter-spacing: 2px;
}

.paper-answer {
  font-size: clamp(2.5rem, 10vw, 4rem);
  font-weight: bold;
  color: #333;
}

.paper-hint {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(0,0,0,0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.action-buttons {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.input-area {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  animation: slideUp 0.3s ease;
}

.answer-input {
  width: 100px;
  height: 60px;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  border: 3px solid #ddd;
  border-radius: 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.answer-input:focus {
  border-color: #4ECDC4;
  box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.2);
}

.answer-input.shake {
  animation: shakeInput 0.4s ease;
  border-color: #FF6B6B;
}

@keyframes shakeInput {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.btn-validate {
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
}

.answer-badge {
  margin-top: 1rem;
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  font-size: 1.2rem;
  font-weight: bold;
  animation: pop 0.3s ease;
}

@keyframes pop {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.answer-badge.correct {
  background: rgba(78, 205, 196, 0.3);
  color: #1a7a6e;
}

.answer-badge.wrong {
  background: rgba(255, 107, 107, 0.3);
  color: #c0392b;
}

.paper-card.input-mode { cursor: default; }

.calc-timer-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(0,0,0,0.08);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  z-index: 10;
}

.calc-timer-fill {
  height: 100%;
  background: #4ECDC4;
  border-radius: 16px 16px 0 0;
  transition: width 1s linear;
}

.calc-timer-fill.urgent { background: #FF6B6B; }

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

.btn-correct {
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
}

.btn-wrong {
  background: linear-gradient(135deg, #FF6B6B, #ee5a24);
  color: white;
}
</style>
