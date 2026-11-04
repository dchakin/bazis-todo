import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTES_ERROR_CODES } from '../app/constants/notes-errors'
import type { NoteContent } from '../app/types/note'
import {
  noteDraftKey,
  readNoteDraft,
  removeNoteDraft,
  writeNoteDraft,
} from '../app/utils/note-draft-storage'
import { createTestStorage } from './helpers/storage'

const content: NoteContent = {
  title: ' Не закончено ',
  todos: [
    {
      id: 'todo-1',
      text: '',
      completed: true,
    },
  ],
}

let storage: ReturnType<typeof createTestStorage>

beforeEach(() => {
  storage = createTestStorage()

  vi.stubGlobal('sessionStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('note draft storage', () => {
  it('keeps versioned drafts for creation and each existing note separately', () => {
    expect(readNoteDraft(null)).toEqual({
      ok: true,
      data: null,
    })

    writeNoteDraft(null, content)
    writeNoteDraft('note-1', {
      title: 'Первая',
      todos: [],
    })
    writeNoteDraft('note-2', {
      title: 'Вторая',
      todos: [],
    })

    expect(JSON.parse(storage.getItem(noteDraftKey(null))!)).toEqual({
      schemaVersion: 1,
      noteId: null,
      content,
    })
    expect(readNoteDraft(null)).toEqual({
      ok: true,
      data: content,
    })
    expect(readNoteDraft('note-1')).toMatchObject({
      data: {
        title: 'Первая',
      },
    })
    expect(readNoteDraft('note-2')).toMatchObject({
      data: {
        title: 'Вторая',
      },
    })

    removeNoteDraft('note-1')

    expect(readNoteDraft('note-1')).toEqual({
      ok: true,
      data: null,
    })
    expect(readNoteDraft(null)).toMatchObject({
      data: content,
    })
  })

  it('returns independent content and preserves whitespace and incomplete fields', () => {
    writeNoteDraft('note-1', content)

    const restored = readNoteDraft('note-1')

    expect(restored).toEqual({
      ok: true,
      data: content,
    })

    if (restored.ok && restored.data) {
      restored.data.todos[0]!.text = 'Изменение'
    }

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content,
    })
  })

  it.each([
    ['invalid JSON', '{broken', NOTES_ERROR_CODES.invalidData],
    ['null', 'null', NOTES_ERROR_CODES.invalidData],
    ['unknown version', '{"schemaVersion":2}', NOTES_ERROR_CODES.unsupportedVersion],
    [
      'wrong note',
      JSON.stringify({
        schemaVersion: 1,
        noteId: 'other-note',
        content,
      }),
      NOTES_ERROR_CODES.invalidData,
    ],
    [
      'invalid todo',
      JSON.stringify({
        schemaVersion: 1,
        noteId: 'note-1',
        content: {
          title: '',
          todos: [
            {
              id: 'todo-1',
              text: '',
              completed: 'yes',
            },
          ],
        },
      }),
      NOTES_ERROR_CODES.invalidData,
    ],
    [
      'duplicate todo IDs',
      JSON.stringify({
        schemaVersion: 1,
        noteId: 'note-1',
        content: {
          ...content,
          todos: [content.todos[0], content.todos[0]],
        },
      }),
      NOTES_ERROR_CODES.invalidData,
    ],
  ])('does not overwrite %s', (_name, raw, code) => {
    storage.setItem(noteDraftKey('note-1'), raw)
    storage.setItem.mockClear()

    expect(readNoteDraft('note-1')).toMatchObject({
      ok: false,
      error: {
        code,
      },
    })
    expect(writeNoteDraft('note-1', content)).toMatchObject({
      ok: false,
      error: {
        code,
      },
    })
    expect(storage.getItem(noteDraftKey('note-1'))).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reports unavailable storage for reading, writing and removal', () => {
    storage.getItem.mockImplementationOnce(() => {
      throw new Error('Blocked')
    })

    expect(readNoteDraft(null)).toMatchObject({
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.readFailed,
      },
    })

    storage.setItem.mockImplementationOnce(() => {
      throw new Error('Quota')
    })

    expect(writeNoteDraft(null, content)).toMatchObject({
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.writeFailed,
      },
    })

    storage.removeItem.mockImplementationOnce(() => {
      throw new Error('Blocked')
    })

    expect(removeNoteDraft(null)).toMatchObject({
      ok: false,
      error: {
        code: NOTES_ERROR_CODES.writeFailed,
      },
    })
  })
})
