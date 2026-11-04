<script setup lang="ts">
const { todoId, index, invalid } = defineProps<{
  todoId: string
  index: number
  invalid: boolean
}>()

const text = defineModel<string>('text', {
  required: true,
})

const completed = defineModel<boolean>('completed', {
  required: true,
})

const emit = defineEmits<{
  remove: []
}>()

const inputId = computed(() => {
  return `todo-${todoId}`
})
</script>

<template>
  <li class="field todo-row">
    <label
      class="field__label todo-row__label"
      :for="inputId"
    >
      Задача {{ index + 1 }}
    </label>

    <input
      v-model="completed"
      class="todo-row__checkbox"
      type="checkbox"
      :aria-label="`Задача ${index + 1} выполнена`"
    />

    <textarea
      :id="inputId"
      v-model="text"
      class="field__input todo-row__text"
      :class="completed ? 'todo-row__text--completed' : undefined"
      rows="2"
      required
      :aria-invalid="invalid || undefined"
      :aria-describedby="invalid ? `${inputId}-error` : undefined"
    />

    <p
      v-if="invalid"
      :id="`${inputId}-error`"
      class="field__error todo-row__error"
    >
      Введите текст задачи или удалите её.
    </p>

    <button
      class="button button--danger-secondary todo-row__remove"
      type="button"
      :aria-label="`Удалить задачу ${index + 1}`"
      @click="emit('remove')"
    >
      Удалить
    </button>
  </li>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.todo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: $space-sm;
  row-gap: $space-xs;

  &__label {
    grid-column: 2;
    grid-row: 1;
    margin: 0;
  }

  &__checkbox {
    grid-column: 1;
    grid-row: 2;
    align-self: center;
    width: $todo-checkbox-size;
    height: $todo-checkbox-size;
    margin: 0;
    accent-color: $accent;
    cursor: pointer;
  }

  &__text {
    grid-column: 2;
    grid-row: 2;
    resize: vertical;

    &--completed {
      color: $color-text-muted;
      text-decoration: line-through;
    }
  }

  &__remove {
    grid-column: 3;
    grid-row: 2;
  }

  &__error {
    grid-column: 2;
    margin: 0;
  }
}

@media (max-width: $breakpoint-mobile) {
  .todo-row {
    grid-template-columns: auto minmax(0, 1fr);

    &__remove {
      grid-column: 2;
      grid-row: auto;
      justify-self: start;
    }
  }
}
</style>
