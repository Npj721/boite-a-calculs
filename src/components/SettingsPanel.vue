<script setup>
import { computed } from 'vue'
import { DIFFICULTY_PRESETS } from '@/lib/game'

const props = defineProps({
  gameMode: String,
  mode: String,
  difficulty: { type: String, default: 'custom' },
  duration: Number,
  localMaxTime: Number,
  opOptions: Object,
  localConfig: Object,
  tableOps: Object,
  selectedTables: Object,
  invalid: Boolean,
})

const emit = defineEmits([
  'toggle-settings',
  'update:gameMode',
  'update:mode',
  'apply-difficulty',
  'update:duration',
  'update:localMaxTime',
  'toggle-op',
  'update-config',
  'update:tableOps',
  'update:selectedTables',
  'reset-config',
  'start-game'
])

const difficultyOptions = [
  ...Object.entries(DIFFICULTY_PRESETS).map(([key, preset]) => ({
    key,
    label: preset.label,
    icon: preset.icon,
    description: preset.description
  })),
  { key: 'custom', label: 'Custom', icon: '🛠️', description: 'Toutes les options de calcul disponibles' }
]

const presetHint = computed(() => {
  const option = difficultyOptions.find(item => item.key === props.difficulty)
  return option ? option.description : ''
})

function u(op, key, val) {
  emit('update-config', { op, key, val })
}
</script>

<template>
  <div class="settings-root">
    <div class="settings-overlay" @click.self="emit('toggle-settings')"></div>
    <div class="settings-panel">
    <div class="settings-header">
      <h2>🚀 Nouvelle partie</h2>
      <button class="settings-close" @click="emit('toggle-settings')">✕</button>
    </div>

    <div class="settings-body">
      <div class="setting-group">
        <div class="mode-selector">
          <button :class="{ active: gameMode === 'normal' }" @click="emit('update:gameMode', 'normal')">🧮 Normal</button>
          <button :class="{ active: gameMode === 'mix' }" @click="emit('update:gameMode', 'mix')">🔀 Mixte</button>
          <button :class="{ active: gameMode === 'table' }" @click="emit('update:gameMode', 'table')">📋 Tables</button>
        </div>
      </div>

      <div v-if="gameMode === 'normal'" class="setting-group">
        <div class="setting-title">Niveau de difficulté</div>
        <div class="difficulty-selector">
          <button
            v-for="option in difficultyOptions"
            :key="option.key"
            class="difficulty-btn"
            :class="{ active: difficulty === option.key }"
            @click="emit('apply-difficulty', option.key)"
          >
            <span class="difficulty-icon">{{ option.icon }}</span>
            <span>{{ option.label }}</span>
          </button>
        </div>
        <p v-if="presetHint" class="difficulty-hint">{{ presetHint }}</p>
      </div>

      <div class="setting-group">
        <div class="setting-title">Durée de la partie</div>
        <div class="duration-row">
          <button
            v-for="preset in [60, 120, 180]"
            :key="preset"
            class="duration-btn"
            :class="{ active: duration === preset }"
            @click="emit('update:duration', preset)"
          >{{ preset }} s</button>
          <input
            class="range-input range-full"
            type="number"
            :value="duration"
            @input="emit('update:duration', +$event.target.value)"
            min="10"
            max="600"
            step="10"
          >
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-title">Mode de réponse</div>
        <div class="mode-toggle">
          <span class="mode-label" :class="{ active: mode === 'flip' }" @click="emit('update:mode', 'flip')">🃏 Retourner</span>
          <div class="toggle-track" @click="emit('update:mode', mode === 'flip' ? 'input' : 'flip')">
            <div class="toggle-knob" :class="{ right: mode === 'input' }"></div>
          </div>
          <span class="mode-label" :class="{ active: mode === 'input' }" @click="emit('update:mode', 'input')">✏️ Écrire</span>
        </div>
        <div class="range-row" style="margin-top: 0.5rem">
          <label>⏱️</label>
          <input class="range-input range-full" type="number" :value="localMaxTime" @input="emit('update:localMaxTime', +$event.target.value)" min="5" max="120">
          <span class="range-label">secondes max / calcul</span>
        </div>
      </div>

      <div v-if="gameMode === 'mix'" class="settings-section-label">Partie calculs</div>

      <template v-if="gameMode === 'mix' || (gameMode === 'normal' && difficulty === 'custom')">
        <div class="setting-group">
          <div class="setting-title">{{ gameMode === 'mix' ? 'Opérations calculs' : 'Opérations' }}</div>
          <div class="op-toggles">
            <button v-for="op in ['+', '-', '×', '÷']" :key="op" class="op-btn" :class="{ active: opOptions[op] }" @click="emit('toggle-op', op)">{{ op }}</button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">Nombre de chiffres (max)</div>
          <p class="digits-hint">Pour chaque opération, choisis le nombre de chiffres maximum du terme A et du terme B (ex. 4 = jusqu’à 4 chiffres).</p>
        </div>

        <div class="setting-group">
          <div class="setting-title">➕ Addition (A + B)</div>
          <div class="range-row">
            <label>A</label>
            <select class="range-input" :value="localConfig['+'].aDigits" @change="u('+', 'aDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <div class="range-row">
            <label>B</label>
            <select class="range-input" :value="localConfig['+'].bDigits" @change="u('+', 'bDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">➖ Soustraction (A − B)</div>
          <div class="range-row">
            <label>A</label>
            <select class="range-input" :value="localConfig['-'].aDigits" @change="u('-', 'aDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <div class="range-row">
            <label>B</label>
            <select class="range-input" :value="localConfig['-'].bDigits" @change="u('-', 'bDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <p class="digits-note">Le résultat sera toujours ≥ 0.</p>
        </div>

        <div class="setting-group">
          <div class="setting-title">✖️ Multiplication (A × B)</div>
          <div class="range-row">
            <label>A</label>
            <select class="range-input" :value="localConfig['×'].aDigits" @change="u('×', 'aDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <div class="range-row">
            <label>B</label>
            <select class="range-input" :value="localConfig['×'].bDigits" @change="u('×', 'bDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">➗ Division (A ÷ B)</div>
          <div class="range-row">
            <label>A</label>
            <select class="range-input" :value="localConfig['÷'].aDigits" @change="u('÷', 'aDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <div class="range-row">
            <label>B</label>
            <select class="range-input" :value="localConfig['÷'].bDigits" @change="u('÷', 'bDigits', +$event.target.value)">
              <option v-for="n in 4" :key="n" :value="n">Jusqu’à {{ n }} chiffre{{ n > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <p class="digits-note">La division restera toujours entière.</p>
        </div>
      </template>

      <div v-if="gameMode === 'mix'" class="settings-section-label">Partie tables</div>

      <template v-if="gameMode === 'table' || gameMode === 'mix'">
        <div class="setting-group">
          <div class="setting-title">Tables de multiplication</div>
          <div class="table-grid">
            <button v-for="n in 9" :key="n" class="table-btn" :class="{ active: selectedTables[n] }" @click="emit('update:selectedTables', { ...selectedTables, [n]: !selectedTables[n] })">{{ n }}</button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">{{ gameMode === 'mix' ? 'Opérations tables' : 'Opérations' }}</div>
          <div class="op-toggles">
            <button v-for="op in ['×', '÷']" :key="op" class="op-btn" :class="{ active: tableOps[op] }" @click="emit('update:tableOps', { ...tableOps, [op]: !tableOps[op] })">{{ op }}</button>
          </div>
        </div>
      </template>

      <p v-if="invalid" class="settings-warn">
        {{ gameMode === 'table' ? 'Choisis au moins une table et une opération.' : gameMode === 'mix' ? 'Choisis au moins un calcul et une table avec une opération.' : 'Choisis au moins une opération.' }}
      </p>
      <button class="btn btn-start-game" :disabled="invalid" @click="emit('start-game')">🏁 Démarrer la partie</button>
      <button class="btn btn-reset-config" @click="emit('reset-config')">↺ Réinitialiser</button>
    </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 50;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 420px;
  max-height: 85vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  z-index: 60;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border-bottom: 2px solid #f0f0f0;
}

.settings-header h2 { font-size: 1.3rem; color: #333; margin: 0; }

.settings-close {
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.settings-close:hover { background: #ddd; }

.settings-body {
  padding: 1rem 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.setting-group {
  background: #f8f8f8;
  border-radius: 12px;
  padding: 0.8rem;
}

.setting-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-section-label {
  margin-top: 0.2rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  background: #e6f6f4;
  color: #2f8f84;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.difficulty-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}

.difficulty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.6rem 0.4rem;
  border: 3px solid #ddd;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-family: inherit;
}

.difficulty-btn.active {
  border-color: #4ECDC4;
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.difficulty-icon { font-size: 1.1rem; }

.difficulty-hint {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
  font-weight: bold;
  text-align: center;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.range-row label {
  width: 2rem;
  font-size: 0.85rem;
  font-weight: bold;
  color: #888;
  text-align: right;
}

.range-input {
  width: 64px;
  height: 36px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: bold;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.range-input:focus { border-color: #4ECDC4; }
.range-sep { color: #ccc; font-size: 0.9rem; }
.range-input.range-full { width: 80px; }
.range-label { font-size: 0.8rem; color: #999; font-weight: bold; }

select.range-input {
  width: auto;
  min-width: 150px;
  padding: 0 0.4rem;
  text-align: left;
  background: white;
}

.digits-hint, .digits-note {
  font-size: 0.8rem;
  color: #888;
  font-weight: bold;
  margin: 0;
}

.digits-note {
  margin-top: 0.4rem;
  font-style: italic;
  color: #777;
}

.btn-reset-config {
  background: #f0f0f0;
  color: #666;
  font-size: 0.95rem;
  padding: 0.7rem 1.5rem;
  width: 100%;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-reset-config:hover { background: #e0e0e0; color: #333; }

.duration-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.duration-btn {
  flex: 1;
  min-width: 64px;
  height: 40px;
  border: 3px solid #ddd;
  border-radius: 10px;
  background: #f5f5f5;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-family: inherit;
}

.duration-btn.active {
  border-color: #4ECDC4;
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.settings-warn {
  font-size: 0.85rem;
  font-weight: bold;
  color: #FF6B6B;
  text-align: center;
}

.btn-start-game {
  background: linear-gradient(135deg, #FF6B6B, #ee5a24);
  color: white;
  font-size: 1.1rem;
  padding: 1rem 1.5rem;
  width: 100%;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

.btn-start-game:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.mode-selector {
  display: flex;
  gap: 0.4rem;
}

.mode-selector button {
  flex: 1;
  padding: 0.7rem 0.5rem;
  border: 3px solid #ddd;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-family: inherit;
}

.mode-selector button.active {
  border-color: #4ECDC4;
  background: white;
  color: #333;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  user-select: none;
}

.mode-label.active { color: #333; }

.toggle-track {
  width: 48px;
  height: 26px;
  background: #ddd;
  border-radius: 13px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.toggle-track:has(.right) { background: #4ECDC4; }

.toggle-knob {
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.toggle-knob.right { transform: translateX(22px); }

.op-toggles {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.op-btn {
  width: 44px;
  height: 44px;
  border: 3px solid #ddd;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-family: inherit;
}

.op-btn.active {
  border-color: currentColor;
  background: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.op-btn:nth-child(1).active { color: #FFB347; border-color: #FFB347; }
.op-btn:nth-child(2).active { color: #A8E6CF; border-color: #A8E6CF; }

.table-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.table-btn {
  height: 44px;
  border: 3px solid #ddd;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-family: inherit;
}

.table-btn.active {
  border-color: #4ECDC4;
  background: white;
  color: #333;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
