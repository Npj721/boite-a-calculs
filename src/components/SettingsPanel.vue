<script setup>
defineProps({
  gameMode: String,
  mode: String,
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
  'update:duration',
  'update:localMaxTime',
  'toggle-op',
  'update-config',
  'update:tableOps',
  'update:selectedTables',
  'reset-config',
  'start-game'
])

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
          <button :class="{ active: gameMode === 'normal' }" @click="emit('update:gameMode', 'normal')">🧮 Boîte à calcul</button>
          <button :class="{ active: gameMode === 'table' }" @click="emit('update:gameMode', 'table')">📋 Tables</button>
        </div>
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

      <template v-if="gameMode === 'normal'">
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

        <div class="setting-group">
          <div class="setting-title">Opérations</div>
          <div class="op-toggles">
            <button v-for="op in ['+', '-', '×', '÷']" :key="op" class="op-btn" :class="{ active: opOptions[op] }" @click="emit('toggle-op', op)">{{ op }}</button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">➕ Addition</div>
          <div class="range-row">
            <label>a</label>
            <input class="range-input" type="number" :value="localConfig['+'].aMin" @input="u('+', 'aMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['+'].aMax" @input="u('+', 'aMax', +$event.target.value)" min="0" max="999">
          </div>
          <div class="range-row">
            <label>b</label>
            <input class="range-input" type="number" :value="localConfig['+'].bMin" @input="u('+', 'bMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['+'].bMax" @input="u('+', 'bMax', +$event.target.value)" min="0" max="999">
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">➖ Soustraction</div>
          <div class="range-row">
            <label>a</label>
            <input class="range-input" type="number" :value="localConfig['-'].aMin" @input="u('-', 'aMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['-'].aMax" @input="u('-', 'aMax', +$event.target.value)" min="0" max="999">
          </div>
          <div class="range-row">
            <label>b</label>
            <input class="range-input" type="number" :value="localConfig['-'].bMin" @input="u('-', 'bMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['-'].bMax" @input="u('-', 'bMax', +$event.target.value)" min="0" max="999">
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">✖️ Multiplication</div>
          <div class="range-row">
            <label>a</label>
            <input class="range-input" type="number" :value="localConfig['×'].aMin" @input="u('×', 'aMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['×'].aMax" @input="u('×', 'aMax', +$event.target.value)" min="0" max="999">
          </div>
          <div class="range-row">
            <label>b</label>
            <input class="range-input" type="number" :value="localConfig['×'].bMin" @input="u('×', 'bMin', +$event.target.value)" min="0" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['×'].bMax" @input="u('×', 'bMax', +$event.target.value)" min="0" max="999">
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">➗ Division</div>
          <div class="range-row">
            <label>div.</label>
            <input class="range-input" type="number" :value="localConfig['÷'].divisorMin" @input="u('÷', 'divisorMin', +$event.target.value)" min="1" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['÷'].divisorMax" @input="u('÷', 'divisorMax', +$event.target.value)" min="1" max="999">
          </div>
          <div class="range-row">
            <label>rép.</label>
            <input class="range-input" type="number" :value="localConfig['÷'].answerMin" @input="u('÷', 'answerMin', +$event.target.value)" min="1" max="999">
            <span class="range-sep">─</span>
            <input class="range-input" type="number" :value="localConfig['÷'].answerMax" @input="u('÷', 'answerMax', +$event.target.value)" min="1" max="999">
          </div>
          <div class="range-row">
            <label>max</label>
            <input class="range-input range-full" type="number" :value="localConfig['÷'].dividendMax" @input="u('÷', 'dividendMax', +$event.target.value)" min="1" max="999">
            <span class="range-label">dividende max</span>
          </div>
        </div>
      </template>

      <template v-if="gameMode === 'table'">
        <div class="setting-group">
          <div class="setting-title">Tables de multiplication</div>
          <div class="table-grid">
            <button v-for="n in 9" :key="n" class="table-btn" :class="{ active: selectedTables[n] }" @click="emit('update:selectedTables', { ...selectedTables, [n]: !selectedTables[n] })">{{ n }}</button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-title">Opérations</div>
          <div class="op-toggles">
            <button v-for="op in ['×', '÷']" :key="op" class="op-btn" :class="{ active: tableOps[op] }" @click="emit('update:tableOps', { ...tableOps, [op]: !tableOps[op] })">{{ op }}</button>
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
      </template>

      <p v-if="invalid" class="settings-warn">
        {{ gameMode === 'table' ? 'Choisis au moins une table et une opération.' : 'Choisis au moins une opération.' }}
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
