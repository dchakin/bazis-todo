<script setup lang="ts">
import type { NoteContent } from '~/types/note'
import { createTodo } from '~/utils/notes'

const { initialNote, canDelete, historyPaused } = defineProps<{
  initialNote: NoteContent
  canDelete: boolean
  historyPaused: boolean
}>()

const emit = defineEmits<{
  change: [note: NoteContent]
  save: [note: NoteContent]
  cancel: []
  delete: []
}>()

const draft = reactive<NoteContent>({
  title: initialNote.title,
  todos: initialNote.todos.map((todo) => {
    return {
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
    }
  }),
})

const submitted = ref(false)
const form = useTemplateRef('form')
const history = useNoteHistory(draft)
const { canUndo, canRedo } = history

watch(
  draft,
  () => {
    emit('change', draft)
  },
  {
    flush: 'sync',
  },
)

const titleError = computed(() => {
  return submitted.value && !draft.title.trim() ? 'Введите название заметки.' : undefined
})

const completedCount = computed(() => {
  return draft.todos.filter((todo) => {
    return todo.completed
  }).length
})

async function addTodo() {
  const todo = createTodo()

  history.addTodo(todo)

  await nextTick()

  document.getElementById(`todo-${todo.id}`)?.focus()
}

async function removeTodo(id: string) {
  const index = draft.todos.findIndex((todo) => {
    return todo.id === id
  })

  if (index === -1) {
    return
  }

  history.removeTodo(id)

  await nextTick()

  const nextTodo = draft.todos[index] ?? draft.todos[index - 1]
  const target = nextTodo
    ? document.getElementById(`todo-${nextTodo.id}`)
    : form.value?.querySelector<HTMLButtonElement>('[data-add-todo]')

  target?.focus()
}

async function saveNote() {
  history.finishTextEdit()

  submitted.value = true

  const hasEmptyTodo = draft.todos.some((todo) => {
    return !todo.text.trim()
  })

  if (!draft.title.trim() || hasEmptyTodo) {
    await nextTick()

    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()

    return
  }

  emit('save', {
    title: draft.title.trim(),
    todos: draft.todos.map((todo) => {
      return {
        id: todo.id,
        text: todo.text.trim(),
        completed: todo.completed,
      }
    }),
  })
}

function cancelEditing() {
  history.finishTextEdit()

  emit('cancel')
}

function deleteNote() {
  history.finishTextEdit()

  emit('delete')
}

function handleHistoryShortcut(event: KeyboardEvent) {
  const isHistoryKey = event.code === 'KeyZ' || event.key.toLowerCase() === 'z'

  if (
    historyPaused ||
    event.defaultPrevented ||
    event.isComposing ||
    !event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    !isHistoryKey
  ) {
    return
  }

  const target = event.target
  const isTextInput =
    target instanceof HTMLElement &&
    (target.closest('input, textarea') !== null || target.isContentEditable)

  if (isTextInput) {
    return
  }

  event.preventDefault()

  if (event.shiftKey) {
    history.redo()
  } else {
    history.undo()
  }
}

watch(
  () => historyPaused,
  (paused) => {
    if (paused) {
      history.finishTextEdit()
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleHistoryShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleHistoryShortcut)

  history.reset()
})
</script>

<template>
  <form
    ref="form"
    class="note-editor"
    novalidate
    @submit.prevent="saveNote"
  >
    <div
      class="note-editor__history"
      role="group"
      aria-label="История изменений"
    >
      <UiButton
        class="note-editor__history-action"
        variant="secondary"
        :disabled="!canUndo"
        aria-label="Отменить изменение"
        aria-keyshortcuts="Control+Z"
        title="Отменить изменение (Ctrl+Z вне текстового поля)"
        @click="history.undo"
      >
        <UiIcon name="undo" />
        Отменить
      </UiButton>

      <UiButton
        class="note-editor__history-action"
        variant="secondary"
        :disabled="!canRedo"
        aria-label="Повторить изменение"
        aria-keyshortcuts="Control+Shift+Z"
        title="Повторить изменение (Ctrl+Shift+Z вне текстового поля)"
        @click="history.redo"
      >
        <UiIcon name="redo" />
        Повторить
      </UiButton>
    </div>

    <UiField
      v-slot="{ inputAttrs }"
      label="Название заметки"
      :error="titleError"
    >
      <UiInput
        v-bind="inputAttrs"
        :model-value="draft.title"
        class="note-editor__title-input"
        placeholder="Например, планы на неделю"
        required
        @update:model-value="history.updateTitle"
        @blur="history.finishTextEdit"
      />
    </UiField>

    <section aria-labelledby="todos-title">
      <div class="note-editor__header">
        <h2
          id="todos-title"
          class="note-editor__section-title"
        >
          Задачи
        </h2>

        <span
          v-if="draft.todos.length"
          class="note-editor__count"
        >
          Выполнено: {{ completedCount }} из {{ draft.todos.length }}
        </span>
      </div>

      <ul
        v-if="draft.todos.length"
        class="note-editor__todos"
      >
        <TodoRow
          v-for="(todo, index) in draft.todos"
          :key="todo.id"
          :text="todo.text"
          :completed="todo.completed"
          :todo-id="todo.id"
          :index="index"
          :invalid="submitted && !todo.text.trim()"
          @update:text="history.updateTodoText(todo.id, $event)"
          @update:completed="history.setTodoCompleted(todo.id, $event)"
          @blur="history.finishTextEdit"
          @remove="removeTodo(todo.id)"
        />
      </ul>

      <div
        v-else
        class="note-editor__empty"
      >
        <UiIcon name="list" />

        <p class="note-editor__empty-text">Добавьте дела, которые хотите держать под рукой.</p>
      </div>

      <UiButton
        class="note-editor__add"
        variant="dashed"
        data-add-todo
        aria-label="Добавить задачу"
        @click="addTodo"
      >
        <UiIcon name="plus" />
        Добавить
      </UiButton>
    </section>

    <div class="note-editor__actions">
      <div class="note-editor__primary-actions">
        <UiButton type="submit"> Сохранить </UiButton>

        <UiButton
          variant="quiet"
          aria-label="Отменить редактирование"
          @click="cancelEditing"
        >
          Отменить
        </UiButton>
      </div>

      <UiButton
        v-if="canDelete"
        variant="danger-quiet"
        aria-label="Удалить заметку"
        @click="deleteNote"
      >
        <UiIcon name="trash" />
        Удалить
      </UiButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.note-editor {
  display: grid;
  gap: $space-2xl;
  padding: $space-2xl;
  border: $border-width solid $color-border;
  border-radius: $radius-lg;
  background-color: $color-surface;
  box-shadow: $shadow-surface;

  &__history {
    display: flex;
    flex-wrap: wrap;
    gap: $space-xs;
  }

  &__history-action {
    flex: 1;
  }

  &__title-input {
    font-size: $font-size-lg;
  }

  &__section-title {
    margin: 0;
    font-size: $font-size-lg;
  }

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-xs;
    margin-bottom: $space-md;
  }

  &__count {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__todos {
    display: grid;
    gap: $space-xs;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__add {
    justify-content: flex-start;
    width: 100%;
    margin-top: $space-sm;
  }

  &__empty {
    display: flex;
    align-items: center;
    gap: $space-sm;
    padding: $space-md;
    border-radius: $radius-sm;
    color: $color-text-muted;
    background-color: $color-background;
  }

  &__empty-text {
    margin: 0;
    font-size: $font-size-sm;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-sm;
    padding-top: $space-xl;
    border-top: $border-width solid $color-border;
  }

  &__primary-actions {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-sm;
  }

  @media (max-width: $breakpoint-mobile) {
    gap: $space-xl;
    padding: $space-md;

    &__history-action {
      --ui-button-padding: #{$space-xs} #{$space-2xs};
    }

    &__primary-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
      flex-basis: 100%;
      gap: $space-xs;
    }
  }
}
</style>
