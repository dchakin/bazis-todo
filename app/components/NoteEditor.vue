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
        class="field__input"
        type="text"
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
      <div class="actions note-editor__header">
        <h2
          id="todos-title"
          class="note-editor__section-title"
        >
          Задачи
        </h2>

        <button
          class="button button--secondary"
          type="button"
          data-add-todo
          @click="addTodo"
        >
          Добавить задачу
        </button>
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

      <p
        v-else
        class="note-editor__empty"
      >
        Задач пока нет. Можно добавить их или сохранить только название.
      </p>
    </section>

    <div class="actions note-editor__actions">
      <button
        class="button"
        type="submit"
      >
        Сохранить
      </button>

      <button
        class="button button--secondary"
        type="button"
        @click="emit('cancel')"
      >
        Отменить редактирование
      </button>

      <button
        v-if="canDelete"
        class="button button--danger-secondary"
        type="button"
        @click="emit('delete')"
      >
        Удалить заметку
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.note-editor {
  display: grid;
  gap: $space-2xl;
  margin-top: $space-2xl;

  &__section-title {
    margin: 0;
    font-size: $font-size-lg;
  }

  &__todos {
    display: grid;
    gap: $space-lg;
    margin: $space-lg 0 0;
    padding: 0;
    list-style: none;
  }

  &__actions {
    padding-top: $space-xl;
    border-top: $border-width solid $color-border;
  }

  &__header {
    justify-content: space-between;
  }

  &__empty {
    color: $color-text-muted;
    overflow-wrap: anywhere;
  }
}
</style>
