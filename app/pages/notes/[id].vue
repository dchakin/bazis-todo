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
  <section class="page">
    <a
      class="link page__back-link"
      href="/"
      @click.prevent="returnToList"
    >
      К списку заметок
    </a>

    <header class="page__header">
      <h1
        class="page__title"
        tabindex="-1"
      >
        {{ pageTitle }}
      </h1>
    </header>

    <div
      v-if="storageError"
      class="error-notice"
      role="alert"
    >
      <p class="error-notice__message">{{ storageError.message }}</p>

      <button
        v-if="!initialNote"
        class="button button--secondary error-notice__retry"
        type="button"
        @click="loadEditor"
      >
        Повторить загрузку
      </button>
    </div>

    <div
      v-if="missing"
      role="status"
    >
      <h2>Заметка не найдена</h2>

      <p class="page__description">Возможно, она была удалена. Вернитесь к списку заметок.</p>

      <NuxtLink
        class="button button--secondary"
        to="/"
      >
        На главную
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
      title="Отменить редактирование?"
      message="Несохранённые изменения будут потеряны."
      confirm-label="Отменить редактирование"
      cancel-label="Продолжить редактирование"
      @confirm="confirmAction"
      @cancel="confirmation = null"
    />

    <ConfirmDialog
      v-else-if="confirmation === 'delete'"
      title="Удалить заметку?"
      message="Заметка будет удалена вместе со всеми задачами."
      confirm-label="Удалить"
      cancel-label="Оставить заметку"
      @confirm="confirmAction"
      @cancel="confirmation = null"
    />
  </section>
</template>
