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

const textInput = useTemplateRef('textInput')

let resizeObserver: ResizeObserver | undefined
let previousWidth = 0

function resizeText() {
  const input = textInput.value

  if (!input) {
    return
  }

  input.style.height = 'auto'
  input.style.height = `${input.scrollHeight + input.offsetHeight - input.clientHeight}px`
}

watch(text, resizeText, {
  flush: 'post',
})

onMounted(() => {
  resizeText()

  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width

    if (width !== undefined && width !== previousWidth) {
      previousWidth = width
      resizeText()
    }
  })

  if (textInput.value) {
    resizeObserver.observe(textInput.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const inputId = computed(() => {
  return `todo-${todoId}`
})
</script>

<template>
  <li class="field todo-row">
    <label class="todo-row__toggle">
      <input
        v-model="completed"
        class="todo-row__checkbox"
        type="checkbox"
        :aria-label="`Задача ${index + 1} выполнена`"
      />
    </label>

    <label
      class="visually-hidden"
      :for="inputId"
    >
      Задача {{ index + 1 }}
    </label>

    <textarea
      :id="inputId"
      ref="textInput"
      v-model="text"
      class="field__input field__input--plain todo-row__text"
      :class="completed ? 'todo-row__text--completed' : undefined"
      rows="1"
      placeholder="Что нужно сделать?"
      required
      :aria-invalid="invalid || undefined"
      :aria-describedby="invalid ? `${inputId}-error` : undefined"
      @blur="emit('blur')"
    />

    <button
      class="button button--icon button--danger-quiet todo-row__remove"
      type="button"
      :aria-label="`Удалить задачу ${index + 1}`"
      :title="`Удалить задачу ${index + 1}`"
      @click="emit('remove')"
    >
      <AppIcon name="trash" />
    </button>

    <p
      v-if="invalid"
      :id="`${inputId}-error`"
      class="field__error todo-row__error"
    >
      Введите текст задачи или удалите её.
    </p>
  </li>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.todo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: $space-2xs;
  padding: $space-xs;
  border: $border-width solid $color-border;
  border-radius: $radius-md;
  background-color: $color-surface;

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 1;
    grid-row: 1;
    min-width: $control-min-height;
    min-height: $control-min-height;
    cursor: pointer;
  }

  &__checkbox {
    width: $todo-checkbox-size;
    height: $todo-checkbox-size;
    margin: 0;
    accent-color: $accent;
    cursor: pointer;
  }

  &__text {
    grid-column: 2;
    grid-row: 1;
    overflow: hidden;
    resize: none;

    &--completed {
      color: $color-text-muted;
      text-decoration: line-through;
    }
  }

  &__remove {
    grid-column: 3;
    grid-row: 1;
  }

  &__error {
    grid-column: 2 / -1;
    margin: 0;
    padding-inline: $space-xs;
  }

  @media (max-width: $breakpoint-mobile) {
    padding: $space-2xs;

    &__text {
      padding-inline: $space-xs;
    }
  }
}
</style>
