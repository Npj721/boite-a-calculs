<script setup>
defineProps({
  remaining: Number,
  phase: String,
  message: String
})

const emit = defineEmits(['draw-paper'])
</script>

<template>
  <div class="box-wrapper" @click="emit('draw-paper')">
    <div class="box" :class="{ shaking: phase === 'drawing', empty: phase === 'empty' }">
      <div class="box-lid">
        <div class="box-ribbon"></div>
      </div>
      <div class="box-body">
        <div class="label">Pioche ici !</div>
        <div class="papers-stack">
          <div
            v-for="i in Math.min(remaining, 12)"
            :key="i"
            class="paper-peek"
            :style="{ transform: `rotate(${(i - 6) * 2}deg) translateY(${i * -1}px)`, backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#E8A0BF'][i % 6], animationDelay: `${i * 0.05}s` }"
          />
        </div>
      </div>
    </div>
    <p v-if="phase === 'empty'" class="box-message">La boîte est vide !</p>
    <p v-else class="box-message">{{ message || 'Clique sur la boîte pour piocher un calcul !' }}</p>
  </div>
</template>

<style scoped>
.box-wrapper {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  -webkit-tap-highlight-color: transparent;
}

.box {
  position: relative;
  width: 260px;
  height: 220px;
  transition: transform 0.2s;
}

.box:hover { transform: scale(1.05); }
.box.shaking { animation: shake 0.6s ease; }

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-5deg); }
  40% { transform: rotate(5deg); }
  60% { transform: rotate(-3deg); }
  80% { transform: rotate(3deg); }
}

.box-lid {
  position: absolute;
  top: -20px;
  left: -10px;
  right: -10px;
  height: 40px;
  background: linear-gradient(135deg, #FF9A9E, #FAD0C4);
  border-radius: 10px 10px 0 0;
  border: 3px solid #e07070;
  border-bottom: none;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box-ribbon {
  width: 30px;
  height: 30px;
  background: #FF6B6B;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.box-body {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #FFDEE9, #B5FFFC);
  border: 3px solid #e07070;
  border-radius: 0 0 10px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  overflow: hidden;
}

.label {
  font-size: 1.1rem;
  font-weight: bold;
  color: #e07070;
  background: rgba(255,255,255,0.7);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  z-index: 2;
}

.papers-stack {
  position: absolute;
  top: -15px;
  left: 20px;
  right: 20px;
  bottom: 10px;
  z-index: 1;
}

.paper-peek {
  position: absolute;
  width: 70%;
  height: 20px;
  left: 15%;
  border-radius: 3px;
  opacity: 0.7;
  animation: floatPaper 2s ease-in-out infinite;
}

@keyframes floatPaper {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.box-message {
  font-size: 1rem;
  color: #ccc;
  text-align: center;
  margin-top: 0.5rem;
}
</style>
