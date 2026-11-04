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

const completedCount = computed(() => {
  return note.todos.filter((todo) => {
    return todo.completed
  }).length
})

const summary = computed(() => {
  return note.todos.length
    ? `Выполнено: ${completedCount.value} из ${note.todos.length}`
    : 'Без задач'
})

const editorPath = computed(() => {
  return `/notes/${encodeURIComponent(note.id)}`
})
</script>

<template>
  <article class="note-card">
    <div class="note-card__header">
      <h2 class="note-card__title">
        <NuxtLink
          class="note-card__title-link"
          :to="editorPath"
          :title="note.title"
          :aria-label="`Открыть заметку «${note.title}»`"
        >
          {{ note.title }}
        </NuxtLink>
      </h2>

      <UiButton
        variant="danger-quiet"
        title="Удалить заметку"
        :aria-label="`Удалить заметку «${note.title}»`"
        @click="emit('delete', note)"
      >
        <UiIcon name="trash" />
      </UiButton>
    </div>

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
        <UiCheckbox
          :model-value="todo.completed"
          class="note-card__check"
          disabled
          aria-hidden="true"
        />

        <span class="visually-hidden">{{ todo.completed ? 'Выполнено:' : 'Не выполнено:' }}</span>

        <span
          class="note-card__todo-text"
          :class="todo.completed ? 'note-card__todo-text--completed' : undefined"
          :title="todo.text"
        >
          {{ todo.text }}
        </span>
      </li>
    </ul>

    <p
      v-else
      class="note-card__empty"
    >
      Здесь можно оставить идею или добавить задачи.
    </p>

    <p
      v-if="remainingCount"
      class="note-card__remaining"
    >
      Ещё задач: {{ remainingCount }}
    </p>

    <div class="note-card__footer">
      <span class="note-card__summary">
        {{ summary }}
      </span>

      <NuxtLink
        class="note-card__edit"
        :to="editorPath"
        :aria-label="`Редактировать заметку «${note.title}»`"
      >
        Открыть
        <UiIcon name="arrow-right" />
      </NuxtLink>
    </div>

    <div class="note-card__progress-track">
      <UiProgress
        v-if="note.todos.length"
        :value="completedCount"
        :max="note.todos.length"
        :aria-label="`Выполнение задач заметки «${note.title}»`"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.note-card {
  display: flex;
  flex-direction: column;
  padding: $space-xl;
  border: $border-width solid $color-border;
  border-radius: $radius-lg;
  background-color: $color-surface;
  box-shadow: $shadow-surface;

  transition:
    translate var(--motion-normal) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing),
    box-shadow var(--motion-normal) var(--motion-easing);

  &:focus-within {
    border-color: $accent;
  }

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    &:hover:not([inert]) {
      translate: 0 $motion-card-lift;
      box-shadow: $shadow-surface-hover;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-xs;
    margin-bottom: $space-md;
  }

  &__title {
    align-self: center;
    margin: 0;
    font-size: $font-size-lg;
    line-height: $line-height-title;
  }

  &__title-link {
    display: block;
    color: $color-text;
    text-decoration: none;
    overflow-wrap: anywhere;

    &:hover {
      color: $accent;
    }
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
    grid-template-columns: $checkbox-size minmax(0, 1fr);
    align-items: center;
    gap: $space-sm;
  }

  &__check {
    --ui-checkbox-min-size: #{$checkbox-size};
  }

  &__remaining {
    margin: 0 0 $space-md;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__empty {
    margin: 0 0 $space-md;
    color: $color-text-muted;
  }

  &__todo-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--completed {
      color: $color-text-muted;
      text-decoration: line-through;
    }
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-xs;
    margin-top: auto;
    padding-top: $space-md;
    border-top: $border-width solid $color-border;
    font-size: $font-size-sm;
  }

  &__summary {
    color: $color-text-muted;
  }

  &__edit {
    display: inline-flex;
    align-items: center;
    gap: $space-xs;
    min-height: $control-min-height;
    color: $accent;
    font-weight: $font-weight-semibold;
    text-decoration: none;

    &:hover {
      color: $accent-hover;
      text-decoration: underline;
    }
  }

  &__progress-track {
    height: $space-2xs;
    margin-top: $space-xs;
  }
}
</style>
