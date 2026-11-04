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

      <NuxtLink
        class="button"
        to="/notes/new"
      >
        Создать заметку
      </NuxtLink>
    </header>

    <div
      v-if="notesStore.error"
      class="error-notice"
      role="alert"
    >
      <p class="error-notice__message">{{ notesStore.error.message }}</p>

      <button
        class="button button--secondary error-notice__retry"
        type="button"
        @click="notesStore.loadNotes()"
      >
        Повторить загрузку
      </button>
    </div>

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
      <h2 class="page__empty-title">Заметок пока нет</h2>

      <p class="page__description">Создайте первую заметку и добавьте задачи.</p>

      <NuxtLink
        class="button button--secondary"
        to="/notes/new"
      >
        Создать первую заметку
      </NuxtLink>
    </div>

    <ConfirmDialog
      v-if="pendingDelete"
      title="Удалить заметку?"
      :message="`Заметка «${pendingDelete.title}» будет удалена вместе со всеми задачами.`"
      confirm-label="Удалить"
      cancel-label="Оставить заметку"
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
    grid-template-columns: repeat(auto-fit, minmax(min(100%, $card-min-width), 1fr));
    gap: $space-md;
    margin-top: $space-2xl;
  }

  &__empty {
    padding: $space-3xl 0 $space-md;
    text-align: center;
  }

  &__empty-title {
    margin: 0;
    font-size: $font-size-lg;
  }
}
</style>
