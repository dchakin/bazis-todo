<script setup lang="ts">
import type { NoteContent } from '~/types/note'
import { createTodo } from '~/utils/notes'

const { initialNote, canDelete } = defineProps<{
  initialNote: NoteContent
  canDelete: boolean
}>()

const emit = defineEmits<{
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
const titleId = useId()

const titleInvalid = computed(() => {
  return submitted.value && !draft.title.trim()
})

const completedCount = computed(() => {
  return draft.todos.filter((todo) => {
    return todo.completed
  }).length
})

async function addTodo() {
  const todo = createTodo()

  draft.todos.push(todo)

  await nextTick()

  document.getElementById(`todo-${todo.id}`)?.focus()
}

async function removeTodo(id: string) {
  const index = draft.todos.findIndex((todo) => {
    return todo.id === id
  })

  draft.todos.splice(index, 1)

  await nextTick()

  const nextTodo = draft.todos[index] ?? draft.todos[index - 1]
  const target = nextTodo
    ? document.getElementById(`todo-${nextTodo.id}`)
    : form.value?.querySelector<HTMLButtonElement>('[data-add-todo]')

  target?.focus()
}

async function saveNote() {
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
</script>

<template>
  <form
    ref="form"
    class="note-editor"
    novalidate
    @submit.prevent="saveNote"
  >
    <div class="field">
      <label
        class="field__label"
        :for="titleId"
      >
        Название заметки
      </label>

      <input
        :id="titleId"
        v-model="draft.title"
        class="field__input note-editor__title-input"
        type="text"
        placeholder="Например, планы на неделю"
        required
        :aria-invalid="titleInvalid || undefined"
        :aria-describedby="titleInvalid ? `${titleId}-error` : undefined"
      />

      <p
        v-if="titleInvalid"
        :id="`${titleId}-error`"
        class="field__error"
      >
        Введите название заметки.
      </p>
    </div>

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
          v-model:text="todo.text"
          v-model:completed="todo.completed"
          :todo-id="todo.id"
          :index="index"
          :invalid="submitted && !todo.text.trim()"
          @remove="removeTodo(todo.id)"
        />
      </ul>

      <div
        v-else
        class="note-editor__empty"
      >
        <AppIcon name="list" />

        <p class="note-editor__empty-text">Добавьте дела, которые хотите держать под рукой.</p>
      </div>

      <button
        class="button note-editor__add"
        type="button"
        data-add-todo
        aria-label="Добавить задачу"
        @click="addTodo"
      >
        <AppIcon name="plus" />
        Добавить
      </button>
    </section>

    <div class="note-editor__actions">
      <div class="note-editor__primary-actions">
        <button
          class="button note-editor__action"
          type="submit"
        >
          Сохранить
        </button>

        <button
          class="button button--quiet note-editor__action"
          type="button"
          aria-label="Отменить редактирование"
          @click="emit('cancel')"
        >
          Отменить
        </button>
      </div>

      <button
        v-if="canDelete"
        class="button button--danger-quiet note-editor__delete"
        type="button"
        aria-label="Удалить заметку"
        @click="emit('delete')"
      >
        <AppIcon name="trash" />
        Удалить
      </button>
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
    padding: $space-sm $space-md;
    border: $border-width dashed $color-input-border;
    color: $accent;
    background-color: $color-surface;

    &:hover {
      border-color: $accent;
      background-color: $color-accent-background;
    }
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

  &__action {
    min-width: 0;
  }

  &__delete {
    font-size: $font-size-sm;
  }

  @media (max-width: $breakpoint-mobile) {
    gap: $space-xl;
    padding: $space-md;

    &__primary-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
      flex-basis: 100%;
      gap: $space-xs;
    }

    &__action {
      padding-inline: $space-xs;
      font-size: $font-size-sm;
    }

    &__delete {
      padding-inline: 0;
    }
  }
}
</style>
