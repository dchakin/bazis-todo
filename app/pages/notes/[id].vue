<script setup lang="ts">
import { NOTES_ERROR_CODES } from '~/constants/notes-errors'
import type { NoteContent } from '~/types/note'

definePageMeta({
  key: (route) => {
    return route.path
  },
})

const route = useRoute()
const notesStore = useNotesStore()
const noteId = String(route.params.id)
const isNew = noteId === 'new'
const initialNote = ref<NoteContent | null>(null)
const missing = ref(false)
const confirmation = ref<'cancel' | 'delete' | null>(null)

const pageTitle = computed(() => {
  return isNew ? 'Новая заметка' : 'Редактирование заметки'
})

const storageError = computed(() => {
  return notesStore.error?.code !== NOTES_ERROR_CODES.notFound ? notesStore.error : null
})

function loadEditor() {
  const result = notesStore.loadNotes()

  if (!result.ok) {
    return
  }

  if (isNew) {
    initialNote.value = {
      title: '',
      todos: [],
    }

    return
  }

  initialNote.value = notesStore.getNote(noteId) ?? null
  missing.value = initialNote.value === null
}

async function returnToList() {
  if (initialNote.value) {
    confirmation.value = 'cancel'

    return
  }

  await navigateTo('/')
}

async function saveNote(content: NoteContent) {
  const result = isNew
    ? notesStore.createNote(content)
    : notesStore.updateNote({
        id: noteId,
        ...content,
      })

  if (!result.ok) {
    if (result.error.code === NOTES_ERROR_CODES.notFound) {
      missing.value = true
      initialNote.value = null
    }

    return
  }

  await navigateTo('/')
}

async function confirmAction() {
  const action = confirmation.value

  confirmation.value = null

  if (action === 'delete') {
    const result = notesStore.deleteNote(noteId)

    if (!result.ok) {
      if (result.error.code === NOTES_ERROR_CODES.notFound) {
        missing.value = true
        initialNote.value = null
      }

      return
    }
  }

  if (action) {
    await navigateTo('/')
  }
}

loadEditor()

useHead({
  title: computed(() => {
    return `${pageTitle.value} — Заметки с задачами`
  }),
})
</script>

<template>
  <section class="page note-page">
    <a
      class="note-page__back-link"
      href="/"
      @click.prevent="returnToList"
    >
      <AppIcon name="arrow-left" />
      К списку заметок
    </a>

    <header class="note-page__header">
      <h1
        class="page__title"
        tabindex="-1"
      >
        {{ pageTitle }}
      </h1>

      <p class="note-page__description">
        {{
          isNew
            ? 'Дайте заметке название и добавьте задачи, если нужно.'
            : 'Изменения сохранятся после нажатия «Сохранить».'
        }}
      </p>
    </header>

    <StorageErrorNotice
      v-if="storageError"
      :message="storageError.message"
      :can-retry="!initialNote"
      @retry="loadEditor"
    />

    <div
      v-if="missing"
      class="note-page__notice"
      role="status"
    >
      <span class="note-page__notice-icon">
        <AppIcon name="notebook" />
      </span>

      <h2 class="note-page__notice-title">Заметка не найдена</h2>

      <p class="note-page__description">Возможно, она была удалена. Вернитесь к списку заметок.</p>

      <NuxtLink
        class="button button--secondary note-page__notice-action"
        to="/"
        aria-label="На главную"
      >
        Вернуться
      </NuxtLink>
    </div>

    <NoteEditor
      v-else-if="initialNote"
      :initial-note="initialNote"
      :can-delete="!isNew"
      @save="saveNote"
      @cancel="confirmation = 'cancel'"
      @delete="confirmation = 'delete'"
    />

    <ConfirmDialog
      v-if="confirmation === 'cancel'"
      title="Выйти без сохранения?"
      message="Изменения в этой заметке не сохранятся."
      confirm-label="Выйти"
      cancel-label="Продолжить"
      @confirm="confirmAction"
      @cancel="confirmation = null"
    />

    <ConfirmDialog
      v-else-if="confirmation === 'delete'"
      title="Удалить заметку?"
      message="Заметка будет удалена вместе со всеми задачами."
      confirm-label="Удалить"
      cancel-label="Отменить"
      @confirm="confirmAction"
      @cancel="confirmation = null"
    />
  </section>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.note-page {
  max-width: $editor-max-width;
  margin-inline: auto;

  &__header {
    margin-bottom: $space-2xl;
  }

  &__back-link {
    display: inline-flex;
    align-items: center;
    gap: $space-xs;
    margin-bottom: $space-xl;
    color: $color-text-muted;
    font-size: $font-size-sm;
    text-decoration: none;

    &:hover {
      color: $accent;
    }
  }

  &__description {
    margin: $space-sm 0 0;
    color: $color-text-muted;
    overflow-wrap: anywhere;
  }

  &__notice {
    padding: $space-2xl;
    border: $border-width solid $color-border;
    border-radius: $radius-lg;
    background-color: $color-surface;
    text-align: center;
  }

  &__notice-icon {
    display: inline-flex;
    padding: $space-md;
    margin-bottom: $space-xl;
    border-radius: $radius-md;
    color: $accent;
    background-color: $color-accent-background;
  }

  &__notice-title {
    margin: 0;
    font-size: $font-size-xl;
  }

  &__notice-action {
    margin-top: $space-xl;
  }

  @media (max-width: $breakpoint-mobile) {
    &__header {
      margin-bottom: $space-xl;
    }
  }
}
</style>
