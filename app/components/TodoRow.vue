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
  blur: []
}>()

const inputId = computed(() => {
  return `todo-${todoId}`
})

const textError = computed(() => {
  return invalid ? 'Введите текст задачи или удалите её.' : undefined
})
</script>

<template>
  <li
    class="todo-row"
    :class="completed ? 'todo-row--completed' : undefined"
  >
    <UiCheckbox
      v-model="completed"
      class="todo-row__toggle"
      :aria-label="`Задача ${index + 1} выполнена`"
    />

    <UiField
      :id="inputId"
      v-slot="{ inputAttrs }"
      class="todo-row__field"
      :error="textError"
    >
      <UiInput
        v-bind="inputAttrs"
        v-model="text"
        class="todo-row__text"
        :class="completed ? 'todo-row__text--completed' : undefined"
        variant="plain"
        multiline
        auto-grow
        placeholder="Текст задачи"
        required
        :aria-label="`Задача ${index + 1}`"
        @blur="emit('blur')"
      />
    </UiField>

    <UiButton
      class="todo-row__remove"
      variant="danger-quiet"
      :aria-label="`Удалить задачу ${index + 1}`"
      :title="`Удалить задачу ${index + 1}`"
      @click="emit('remove')"
    >
      <UiIcon name="trash" />
    </UiButton>
  </li>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.todo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: $space-xs;
  padding: $space-sm;
  border: $border-width solid $color-border;
  border-radius: $radius-md;
  background-color: $color-surface;
  animation: surface-enter var(--motion-normal) var(--motion-easing);
  transition: background-color var(--motion-normal) var(--motion-easing);

  &--completed {
    background-color: $color-accent-background;
  }

  &__toggle {
    grid-column: 1;
    grid-row: 1;
  }

  &__field {
    grid-column: 2;
    grid-row: 1;
  }

  &__text {
    --ui-input-text-color: #{$color-text};

    &--completed {
      --ui-input-text-color: #{$color-text-muted};
      text-decoration: line-through;
    }
  }

  &__remove {
    grid-column: 3;
    grid-row: 1;
  }

  @media (max-width: $breakpoint-mobile) {
    padding: $space-xs;
  }
}
</style>
