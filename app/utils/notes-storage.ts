import type { Note, NotesContainer, NotesResult, Todo } from '../types/note'
import { copyNote } from './notes'

export const NOTES_STORAGE_KEY = 'bazis-todo:notes'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isTodo(value: unknown): value is Todo {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean'
  )
}

function isNote(value: unknown): value is Note {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    value.id === 'new' ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.todos) ||
    !value.todos.every(isTodo)
  ) {
    return false
  }

  const todoIds = value.todos.map((todo) => {
    return todo.id
  })

  return new Set(todoIds).size === todoIds.length
}

function isNotesContainer(value: unknown): value is NotesContainer {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.notes) ||
    !value.notes.every(isNote)
  ) {
    return false
  }

  const noteIds = value.notes.map((note) => {
    return note.id
  })

  return new Set(noteIds).size === noteIds.length
}

export function readNotes(): NotesResult<Note[]> {
  let raw: string | null

  try {
    raw = localStorage.getItem(NOTES_STORAGE_KEY)
  } catch {
    return {
      ok: false,
      error: {
        code: 'read-failed',
        message: 'Не удалось прочитать сохранённые заметки.',
      },
    }
  }

  if (raw === null) {
    return {
      ok: true,
      data: [],
    }
  }

  let container: unknown

  try {
    container = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid-data',
        message: 'Сохранённые заметки повреждены.',
      },
    }
  }

  if (
    isRecord(container) &&
    typeof container.schemaVersion === 'number' &&
    container.schemaVersion !== 1
  ) {
    return {
      ok: false,
      error: {
        code: 'unsupported-version',
        message: 'Версия сохранённых заметок не поддерживается.',
      },
    }
  }

  if (!isNotesContainer(container)) {
    return {
      ok: false,
      error: {
        code: 'invalid-data',
        message: 'Сохранённые заметки имеют неверный формат.',
      },
    }
  }

  return {
    ok: true,
    data: container.notes.map(copyNote),
  }
}

export function writeNotes(notes: Note[]): NotesResult<void> {
  const container: NotesContainer = {
    schemaVersion: 1,
    notes,
  }

  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(container))
  } catch {
    return {
      ok: false,
      error: {
        code: 'write-failed',
        message: 'Не удалось записать заметки в хранилище. Попробуйте ещё раз.',
      },
    }
  }

  return {
    ok: true,
    data: undefined,
  }
}
