import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, NoteContent, NotesError, NotesResult } from '../types/note'
import { copyNote } from '../utils/notes'
import { readNotes, writeNotes } from '../utils/notes-storage'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const error = ref<NotesError | null>(null)

  function loadNotes(): NotesResult<void> {
    const result = readNotes()

    if (!result.ok) {
      error.value = result.error

      return result
    }

    notes.value = result.data
    error.value = null

    return {
      ok: true,
      data: undefined,
    }
  }

  function getNote(id: string): Note | undefined {
    const note = notes.value.find((item) => {
      return item.id === id
    })

    return note ? copyNote(note) : undefined
  }

  function persistNotes(nextNotes: Note[]): NotesResult<void> {
    const result = writeNotes(nextNotes)

    if (!result.ok) {
      error.value = result.error

      return result
    }

    notes.value = nextNotes
    error.value = null

    return result
  }

  function createNote(content: NoteContent): NotesResult<Note> {
    const latest = readNotes()

    if (!latest.ok) {
      error.value = latest.error

      return latest
    }

    const note = copyNote({
      id: crypto.randomUUID(),
      title: content.title,
      todos: content.todos,
    })

    const result = persistNotes([...latest.data, note])

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      data: copyNote(note),
    }
  }

  function noteNotFound(latestNotes: Note[]): NotesResult<never> {
    notes.value = latestNotes
    error.value = {
      code: 'not-found',
      message: 'Заметка не найдена',
    }

    return {
      ok: false,
      error: error.value,
    }
  }

  function updateNote(note: Note): NotesResult<Note> {
    const latest = readNotes()

    if (!latest.ok) {
      error.value = latest.error

      return latest
    }

    const index = latest.data.findIndex((item) => {
      return item.id === note.id
    })

    if (index === -1) {
      return noteNotFound(latest.data)
    }

    const savedNote = copyNote(note)

    latest.data[index] = savedNote

    const result = persistNotes(latest.data)

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      data: copyNote(savedNote),
    }
  }

  function deleteNote(id: string): NotesResult<void> {
    const latest = readNotes()

    if (!latest.ok) {
      error.value = latest.error

      return latest
    }

    const hasNote = latest.data.some((note) => {
      return note.id === id
    })

    if (!hasNote) {
      return noteNotFound(latest.data)
    }

    const nextNotes = latest.data.filter((note) => {
      return note.id !== id
    })

    return persistNotes(nextNotes)
  }

  return {
    notes,
    error,
    loadNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
  }
})
