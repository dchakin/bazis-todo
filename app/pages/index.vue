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
  <section class="page">
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

    <TransitionGroup
      v-if="notesStore.notes.length"
      tag="div"
      :css="false"
      move-class="page__note-move"
      class="page__notes"
    >
      <NoteCard
        v-for="note in notesStore.notes"
        :key="note.id"
        :note="note"
        @delete="pendingDelete = $event"
      />
    </TransitionGroup>

    <div
      v-else-if="!notesStore.error"
      class="page__empty"
    >
      <span class="page__empty-icon">
        <UiIcon name="notebook" />
      </span>

      <h2 class="page__empty-title">Заметок пока нет</h2>

      <p class="page__empty-description">Создайте первую заметку.</p>

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
  animation: surface-enter var(--motion-normal) var(--motion-easing);

  &__notes > &__note-move {
    transition: transform var(--motion-slow) var(--motion-easing);
  }

  &__notes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, $card-min-width), 1fr));
    gap: $space-lg;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $space-lg;
    border: $border-width dashed $color-input-border;
    border-radius: $radius-md;
    background-color: $color-surface;
    text-align: center;
  }

  &__empty-icon {
    display: grid;
    place-items: center;
    padding: $space-lg;
    margin-bottom: $space-lg;
    border-radius: $radius-md;
    color: $accent;
    background-color: $color-accent-background;
  }

  &__empty-title {
    margin: 0;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
  }

  @media (max-width: $breakpoint-mobile) {
    &__empty {
      padding: $space-md;
    }
  }

  &__empty-description {
    max-width: $dialog-max-width;
    margin: $space-sm 0 $space-lg;
    color: $color-text-muted;
  }
}
</style>
