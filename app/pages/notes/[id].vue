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
const externallyDeleted = ref(false)
const confirmation = ref<'cancel' | 'delete' | 'restore' | null>(null)
const recoveryNote = ref<NoteContent | null>(null)
const completionMessage = ref<string | null>(null)
const completionTitle = useTemplateRef('completionTitle')
const draft = useNoteDraft(isNew ? null : noteId)
const { error: draftError } = draft

const missingTitle = computed(() => {
  return externallyDeleted.value ? 'Заметка удалена' : 'Заметка не найдена'
})

const missingDescription = computed(() => {
  return externallyDeleted.value
    ? 'Эту заметку удалили в другой вкладке. Вернитесь к списку заметок.'
    : 'Возможно, она была удалена. Вернитесь к списку заметок.'
})

const recoveryMessage = computed(() => {
  return (
    storageError.value?.message ??
    draftError.value?.message ??
    'В этой вкладке остались несохранённые изменения.'
  )
})

const pageTitle = computed(() => {
  return isNew ? 'Новая заметка' : 'Редактирование заметки'
})

const pageDescription = computed(() => {
  return isNew
    ? 'Дайте заметке название и добавьте задачи, если нужно.'
    : 'Изменения сохранятся после нажатия «Сохранить».'
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
  } else {
    initialNote.value = notesStore.getNote(noteId) ?? null
  }

  if (!initialNote.value) {
    markMissing()

    return
  }

  recoveryNote.value = draft.load()

  if (recoveryNote.value) {
    confirmation.value = 'restore'
  }
}

function markMissing(deleted = false) {
  draft.stop()
  draft.clear()

  confirmation.value = null
  recoveryNote.value = null
  initialNote.value = null
  missing.value = true
  externallyDeleted.value = deleted
}

function handleStorageEvent(event: StorageEvent) {
  const result = notesStore.handleStorageEvent(event)

  if (result?.ok && !completionMessage.value && !isNew && !notesStore.getNote(noteId)) {
    markMissing(true)
  }
}

function restoreDraft() {
  const result = notesStore.loadNotes()

  if (!result.ok) {
    return
  }

  if (!isNew && !notesStore.getNote(noteId)) {
    markMissing(true)

    return
  }

  initialNote.value = recoveryNote.value
  recoveryNote.value = null
  confirmation.value = null
}

function discardDraft() {
  const result = notesStore.loadNotes()

  if (!result.ok) {
    return
  }

  const savedNote = isNew ? initialNote.value : notesStore.getNote(noteId)

  if (!savedNote) {
    markMissing(true)

    return
  }

  if (!draft.clear()) {
    return
  }

  initialNote.value = savedNote
  recoveryNote.value = null
  confirmation.value = null
}

async function returnToList() {
  if (completionMessage.value) {
    await clearDraftAndReturn()

    return
  }

  if (initialNote.value) {
    confirmation.value = 'cancel'

    return
  }

  await navigateTo('/')
}

async function clearDraftAndReturn() {
  if (!draft.clear()) {
    await nextTick()

    completionTitle.value?.focus()

    return
  }

  await navigateTo('/')
}

async function completeEditing(message: string) {
  draft.stop()

  initialNote.value = null
  recoveryNote.value = null
  completionMessage.value = message

  await clearDraftAndReturn()
}

async function saveNote(content: NoteContent) {
  if (completionMessage.value) {
    return
  }

  const result = isNew
    ? notesStore.createNote(content)
    : notesStore.updateNote({
        id: noteId,
        ...content,
      })

  if (!result.ok) {
    if (result.error.code === NOTES_ERROR_CODES.notFound) {
      markMissing(true)
    }

    return
  }

  await completeEditing('Заметка сохранена')
}

async function confirmAction() {
  const action = confirmation.value

  confirmation.value = null

  if (!action || action === 'restore') {
    return
  }

  if (action === 'delete') {
    const result = notesStore.deleteNote(noteId)

    if (!result.ok) {
      if (result.error.code === NOTES_ERROR_CODES.notFound) {
        markMissing(true)
      }

      return
    }

    await completeEditing('Заметка удалена')

    return
  }

  if (!draft.clear()) {
    return
  }

  draft.stop()

  await navigateTo('/')
}

loadEditor()

onMounted(() => {
  window.addEventListener('storage', handleStorageEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorageEvent)
})

useHead({
  title: computed(() => {
    return `${pageTitle.value} — Заметки с задачами`
  }),
})
</script>

<template>
  <section class="note-page">
    <a
      class="note-page__back-link"
      href="/"
      @click.prevent="returnToList"
    >
      <UiIcon name="arrow-left" />
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
        {{ pageDescription }}
      </p>
    </header>

    <StorageErrorNotice
      v-if="storageError"
      :message="storageError.message"
      :can-retry="!initialNote && !completionMessage"
      @retry="loadEditor"
    />

    <StorageErrorNotice
      v-if="draftError"
      :message="draftError.message"
      :can-retry="false"
    />

    <div
      v-if="completionMessage"
      class="note-page__notice"
      role="status"
    >
      <h2
        ref="completionTitle"
        class="note-page__notice-title"
        tabindex="-1"
      >
        {{ completionMessage }}
      </h2>

      <UiButton
        class="note-page__notice-action"
        variant="secondary"
        aria-label="Повторить удаление черновика"
        @click="clearDraftAndReturn"
      >
        Повторить
      </UiButton>
    </div>

    <div
      v-else-if="missing"
      class="note-page__notice"
      role="status"
    >
      <span class="note-page__notice-icon">
        <UiIcon name="notebook" />
      </span>

      <h2 class="note-page__notice-title">{{ missingTitle }}</h2>

      <p class="note-page__description">{{ missingDescription }}</p>

      <UiButton
        class="note-page__notice-action"
        variant="secondary"
        to="/"
        aria-label="На главную"
      >
        Вернуться
      </UiButton>
    </div>

    <NoteEditor
      v-else-if="initialNote && !recoveryNote"
      :initial-note="initialNote"
      :can-delete="!isNew"
      :history-paused="confirmation !== null"
      @change="draft.schedule"
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
      v-else-if="confirmation === 'restore'"
      title="Восстановить черновик?"
      :message="recoveryMessage"
      confirm-label="Восстановить"
      cancel-label="Отбросить"
      initial-focus="title"
      :danger="false"
      @confirm="restoreDraft"
      @cancel="discardDraft"
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

    &:focus {
      outline: none;
    }
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
