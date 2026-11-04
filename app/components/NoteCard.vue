<script setup lang="ts">
import type { Note } from '~/types/note'

const { note } = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  delete: [note: Note]
}>()

const previewTodos = computed(() => {
  return note.todos.slice(0, 3)
})

const remainingCount = computed(() => {
  return Math.max(0, note.todos.length - 3)
})
</script>

<template>
  <article class="note-card">
    <h2 class="note-card__title">{{ note.title }}</h2>

    <ul
      v-if="previewTodos.length"
      class="note-card__todos"
      aria-label="Первые задачи"
    >
      <li
        v-for="todo in previewTodos"
        :key="todo.id"
        class="note-card__todo"
      >
        <span
          class="note-card__check"
          aria-hidden="true"
        >
          {{ todo.completed ? '✓' : '○' }}
        </span>

        <span class="visually-hidden">{{ todo.completed ? 'Выполнено:' : 'Не выполнено:' }}</span>

        <span
          class="note-card__todo-text"
          :class="todo.completed ? 'note-card__todo-text--completed' : undefined"
        >
          {{ todo.text }}
        </span>
      </li>
    </ul>

    <p
      v-else
      class="note-card__empty"
    >
      Без задач
    </p>

    <p
      v-if="remainingCount"
      class="note-card__remaining"
    >
      Ещё задач: {{ remainingCount }}
    </p>

    <div class="actions note-card__actions">
      <NuxtLink
        class="button button--secondary"
        :to="`/notes/${encodeURIComponent(note.id)}`"
        :aria-label="`Редактировать заметку «${note.title}»`"
      >
        Редактировать
      </NuxtLink>

      <button
        class="button button--danger-secondary"
        type="button"
        :aria-label="`Удалить заметку «${note.title}»`"
        @click="emit('delete', note)"
      >
        Удалить
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.note-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: $space-lg;
  border: $border-width solid $color-border;
  border-radius: $radius-md;
  overflow-wrap: anywhere;

  &__title {
    margin: 0 0 $space-md;
    font-size: $font-size-lg;
    line-height: $line-height-title;
    white-space: pre-wrap;
  }

  &__todos {
    display: grid;
    gap: $space-sm;
    margin: 0 0 $space-md;
    padding: 0;
    list-style: none;
  }

  &__todo {
    display: grid;
    grid-template-columns: $space-lg minmax(0, 1fr);
    gap: $space-xs;
  }

  &__check {
    color: $accent;
  }

  &__remaining {
    margin: 0 0 $space-md;
    font-size: $font-size-sm;
  }

  &__actions {
    margin-top: auto;
    padding-top: $space-xs;
  }

  &__empty,
  &__remaining {
    color: $color-text-muted;
    overflow-wrap: anywhere;
  }

  &__todo-text {
    white-space: pre-wrap;

    &--completed {
      color: $color-text-muted;
      text-decoration: line-through;
    }
  }
}
</style>
