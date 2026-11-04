import { NOTES_ERROR_CODES } from '../constants/notes-errors'
import type { Note, NotesContainer, NotesResult } from '../types/note'
import { copyNote } from './notes'
import { isNote, isRecord } from './note-validation'

export const NOTES_STORAGE_KEY = 'bazis-todo:notes'

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
        code: NOTES_ERROR_CODES.readFailed,
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
        code: NOTES_ERROR_CODES.invalidData,
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
        code: NOTES_ERROR_CODES.unsupportedVersion,
        message: 'Версия сохранённых заметок не поддерживается.',
      },
    }
  }

  if (!isNotesContainer(container)) {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.invalidData,
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
        code: NOTES_ERROR_CODES.writeFailed,
        message: 'Не удалось записать заметки в хранилище. Попробуйте ещё раз.',
      },
    }
  }

  return {
    ok: true,
    data: undefined,
  }
}
