<script setup>
defineProps({
  reviewTarget: Object,
  modelValue: String,
  showError: Boolean
})

const emit = defineEmits([
  'update:modelValue',
  'submit-review',
  'cancel-review'
])
</script>

<template>
  <div class="review-stage">
    <div class="review-paper" :style="{ backgroundColor: reviewTarget.paper.color }">
      <div class="review-label">Correction :</div>
      <div class="review-question">{{ reviewTarget.paper.question }}</div>
      <div class="review-answer">{{ reviewTarget.paper.answer }}</div>
    </div>
    <div class="input-area">
      <input
        class="answer-input"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        type="number"
        placeholder="?"
        @keydown.enter="emit('submit-review')"
      />
      <button class="btn btn-validate" @click="emit('submit-review')">Valider ✅</button>
      <button class="btn btn-review-cancel" @click="emit('cancel-review')">↩ Retour</button>
    </div>
  </div>
</template>

<style scoped>
.review-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
  padding: 1rem;
}

.review-paper {
  width: 280px;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.review-label {
  font-size: 1rem;
  color: rgba(0,0,0,0.5);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.review-question {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
}

.review-answer {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin-top: 0.5rem;
}

.input-area {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

.btn-validate {
  background: linear-gradient(135deg, #4ECDC4, #44B09E);
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
}

.btn-review-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-review-cancel:hover { background: #e0e0e0; }

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
