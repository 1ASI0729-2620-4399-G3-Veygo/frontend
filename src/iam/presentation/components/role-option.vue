<script setup>
/**
 * Presentation component for choosing how the user wants to use Veygo (Renter or Owner).
 */

/** @type {{value: string, selected: boolean, icon: string, title: string, description: string}} */
const {value, selected, icon, title, description} = defineProps({
  value: {type: String, required: true},
  selected: {type: Boolean, default: false},
  icon: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String, required: true}
});

/** Emitted with the role value when the option is chosen. */
const emit = defineEmits(['selected']);
</script>

<template>
  <button type="button" role="radio" class="role-option" :class="{ 'role-option--selected': selected }"
          :aria-checked="selected" @click="emit('selected', value)">
    <i :class="icon" aria-hidden="true"/>
    <span>
      <strong>{{ title }}</strong>
      <small>{{ description }}</small>
    </span>
    <span class="role-option__radio" aria-hidden="true"/>
  </button>
</template>

<style scoped>
.role-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
  padding: 1.1rem;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 16px;
  background: rgba(255, 255, 255, .03);
  color: #fff;
  cursor: pointer;
  font: inherit;
}

.role-option > .pi {
  font-size: 1.8rem;
  color: #71717a;
  margin-top: .25rem;
}

.role-option strong {
  display: block;
  font-size: 1.05rem;
}

.role-option small {
  color: #a1a1aa;
}

.role-option__radio {
  flex-shrink: 0;
  margin-left: auto;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #71717a;
}

.role-option--selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, .14);
}

.role-option--selected > .pi {
  color: #3b82f6;
}

.role-option--selected .role-option__radio {
  border: 6px solid #3b82f6;
  background: #fff;
}
</style>
