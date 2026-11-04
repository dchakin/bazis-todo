<script setup lang="ts">
import type { Note } from '~/types/note'

const notesStore = useNotesStore()
const pendingDelete = ref<Note | null>(null)

notesStore.loadNotes()

function deleteNote() {
  if (!pendingDelete.value) {
    return
  }

  notesStore.deleteNote(pendingDelete.value.id)
  pendingDelete.value = null
}

useHead({
  title: 'Мои заметки — Заметки с задачами',
})
</script>

<template>
  <section>
    <header class="page__header">
      <h1
        class="page__title"
        tabindex="-1"
      >
        Мои заметки
      </h1>

      <UiButton
        v-if="notesStore.notes.length || notesStore.error"
        to="/notes/new"
        aria-label="Создать заметку"
      >
        <UiIcon name="plus" />
        Создать
      </UiButton>
    </header>

    <StorageErrorNotice
      v-if="notesStore.error"
      :message="notesStore.error.message"
      @retry="notesStore.loadNotes()"
    />

    <div
      v-if="notesStore.notes.length"
      class="page__notes"
    >
      <NoteCard
        v-for="note in notesStore.notes"
        :key="note.id"
        :note="note"
        @delete="pendingDelete = $event"
      />
    </div>

    <div
      v-else-if="!notesStore.error"
      class="page__empty"
    >
      <span class="page__empty-icon">
        <UiIcon name="notebook" />
      </span>

      <h2 class="page__empty-title">Заметок пока нет</h2>

      <p class="page__empty-description">
        Сохраните идею, составьте список покупок или спланируйте день.
      </p>

      <UiButton
        to="/notes/new"
        aria-label="Создать заметку"
      >
        <UiIcon name="plus" />
        Создать
      </UiButton>
    </div>

    <ConfirmDialog
      v-if="pendingDelete"
      title="Удалить заметку?"
      :message="`Заметка «${pendingDelete.title}» будет удалена вместе со всеми задачами.`"
      confirm-label="Удалить"
      cancel-label="Отменить"
      @confirm="deleteNote"
      @cancel="pendingDelete = null"
    />
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page {
  &__notes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, $card-min-width), 1fr));
    gap: $space-xl;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $space-3xl $space-xl;
    border: $border-width dashed $color-input-border;
    border-radius: $radius-lg;
    background-color: $color-surface;
    text-align: center;
  }

  &__empty-icon {
    display: grid;
    place-items: center;
    padding: $space-xl;
    margin-bottom: $space-xl;
    border-radius: $radius-lg;
    color: $accent;
    background-color: $color-accent-background;
  }

  &__empty-title {
    margin: 0;
    font-size: $font-size-xl;
  }

  &__empty-description {
    max-width: $dialog-max-width;
    margin: $space-sm 0 $space-xl;
    color: $color-text-muted;
  }
}
</style>
