import { NOTES_ERROR_CODES } from '../constants/notes-errors'
import type { NoteContent, NotesResult } from '../types/note'
import type { NoteDraft } from '../types/note-draft'
import { isNoteContent, isRecord } from './note-validation'

export function noteDraftKey(noteId: string | null): string {
  return `bazis-todo:draft:${noteId ?? 'new'}`
}

export function readNoteDraft(noteId: string | null): NotesResult<NoteContent | null> {
  let raw: string | null

  try {
    raw = sessionStorage.getItem(noteDraftKey(noteId))
  } catch {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.readFailed,
        message: 'Не удалось прочитать черновик этой вкладки.',
      },
    }
  }

  if (raw === null) {
    return {
      ok: true,
      data: null,
    }
  }

  let draft: unknown

  try {
    draft = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.invalidData,
        message: 'Черновик повреждён. Его данные не перезаписаны.',
      },
    }
  }

  if (isRecord(draft) && typeof draft.schemaVersion === 'number' && draft.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.unsupportedVersion,
        message: 'Версия черновика не поддерживается. Его данные не перезаписаны.',
      },
    }
  }

  if (
    !isRecord(draft) ||
    draft.schemaVersion !== 1 ||
    draft.noteId !== noteId ||
    !isNoteContent(draft.content)
  ) {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.invalidData,
        message: 'Черновик имеет неверный формат. Его данные не перезаписаны.',
      },
    }
  }

  return {
    ok: true,
    data: draft.content,
  }
}

export function writeNoteDraft(noteId: string | null, content: NoteContent): NotesResult<void> {
  const existing = readNoteDraft(noteId)

  if (!existing.ok) {
    return existing
  }

  const draft: NoteDraft = {
    schemaVersion: 1,
    noteId,
    content,
  }

  try {
    sessionStorage.setItem(noteDraftKey(noteId), JSON.stringify(draft))
  } catch {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.writeFailed,
        message: 'Не удалось записать черновик. Изменения остаются в редакторе.',
      },
    }
  }

  return {
    ok: true,
    data: undefined,
  }
}

export function removeNoteDraft(noteId: string | null): NotesResult<void> {
  try {
    sessionStorage.removeItem(noteDraftKey(noteId))
  } catch {
    return {
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.writeFailed,
        message: 'Не удалось удалить черновик. Попробуйте ещё раз.',
      },
    }
  }

  return {
    ok: true,
    data: undefined,
  }
}
